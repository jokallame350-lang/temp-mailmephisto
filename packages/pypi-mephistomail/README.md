# mephistomail

> Official Python SDK for [MephistoMail](https://mephistomail.site) — Instant Disposable Temp Mail & AI OTP Extraction API for Selenium / Playwright / PyTest E2E Automation.

[![PyPI Version](https://img.shields.io/pypi/v/mephistomail.svg)](https://pypi.org/project/mephistomail/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Website](https://img.shields.io/badge/Website-mephistomail.site-orange)](https://mephistomail.site)

## 📦 Installation

```bash
pip install mephistomail
```

## 🚀 Quickstart

```python
from mephistomail import MephistoMail

mephisto = MephistoMail()

# 1. Create a 1-click temp inbox
inbox = mephisto.create_inbox()
print(f"Temp Address: {inbox.address}")

# 2. Automatically wait for 6-digit OTP code
otp_code = inbox.wait_for_otp(timeout_seconds=30)
print(f"Extracted OTP Code: {otp_code}")
```

## 🧪 Selenium & PyTest E2E Integration

```python
import pytest
from selenium import webdriver
from mephistomail import MephistoMail

def test_signup_otp_flow():
    mephisto = MephistoMail()
    inbox = mephisto.create_inbox()
    
    driver = webdriver.Chrome()
    driver.get("https://your-app.com/signup")
    
    driver.find_element("name", "email").send_keys(inbox.address)
    driver.find_element("id", "submit").click()
    
    # Automatically wait for OTP code from MephistoMail API
    otp_code = inbox.wait_for_otp()
    driver.find_element("name", "otp").send_keys(otp_code)
    driver.find_element("id", "verify").click()
    
    assert "dashboard" in driver.current_url
```

## 🔗 Official Links
- **Web App:** [https://mephistomail.site](https://mephistomail.site)
- **GitHub Repository:** [https://github.com/jokallame350-lang/temp-mailmephisto](https://github.com/jokallame350-lang/temp-mailmephisto)
- **Support:** [jokallame0@gmail.com](mailto:jokallame0@gmail.com)
