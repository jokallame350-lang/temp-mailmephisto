import time
import re
import requests

API_BASE = "https://mephistomail.site/api/v1"

class MephistoMail:
    """Official Python SDK for MephistoMail (https://mephistomail.site)"""
    def __init__(self, api_base=API_BASE):
        self.api_base = api_base

    def create_inbox(self, custom_username=None):
        import random
        import string
        username = custom_username or "test_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=7))
        domain = "sharklasers.com"
        address = f"{username}@{domain}"
        return MephistoInbox(self, username, address, domain)

    def get_messages(self, address):
        try:
            res = requests.get(f"{self.api_base}/inbox", params={"address": address}, timeout=10)
            if res.status_code == 200:
                return res.json()
            return []
        except Exception:
            return []

    def wait_for_otp(self, address, timeout_seconds=30):
        start_time = time.time()
        while time.time() - start_time < timeout_seconds:
            messages = self.get_messages(address)
            if messages:
                latest = messages[0]
                text = (latest.get("subject", "") + " " + latest.get("body", ""))
                match = re.search(r"\b\d{4,8}\b", text)
                if match:
                    return match.group(0)
            time.sleep(2)
        raise TimeoutError(f"Timeout waiting for OTP on {address}")


class MephistoInbox:
    def __init__(self, client, username, address, domain):
        self.client = client
        self.username = username
        self.address = address
        self.domain = domain
        self.created_at = time.time()

    def get_messages(self):
        return self.client.get_messages(self.address)

    def wait_for_otp(self, timeout_seconds=30):
        return self.client.wait_for_otp(self.address, timeout_seconds)
