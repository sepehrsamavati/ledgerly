import os
import time
from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Navigate to app
    page.goto("http://localhost:3000")
    page.wait_for_timeout(1000)

    # Screenshot dashboard
    page.screenshot(path="/app/verification/screenshots/dashboard.png")
    page.wait_for_timeout(500)

    # Navigate to Settings
    page.get_by_role("button", name="Settings").click()
    page.wait_for_timeout(1000)

    # Screenshot Settings page
    page.screenshot(path="/app/verification/screenshots/settings.png")
    page.wait_for_timeout(500)

    # Navigate to Groups
    page.get_by_role("button", name="Groups").click()
    page.wait_for_timeout(1000)

    # Click Create Group
    page.get_by_role("button", name="Create Group").first.click()
    page.wait_for_timeout(500)

    # Fill Group info
    inputs = page.get_by_role("textbox").all()
    inputs[0].fill("Multi-Currency Vacation")
    inputs[1].fill("Trip with mixed EUR and USD expenses")
    page.get_by_role("button", name="Save").click()
    page.wait_for_timeout(1000)

    # Add Person 1
    page.get_by_role("button", name="Add Person").click()
    page.wait_for_timeout(500)
    page.get_by_role("textbox").fill("Alice")
    page.get_by_role("button", name="Save").click()
    page.wait_for_timeout(500)

    # Add Person 2
    page.get_by_role("button", name="Add Person").click()
    page.wait_for_timeout(500)
    page.get_by_role("textbox").fill("Bob")
    page.get_by_role("button", name="Save").click()
    page.wait_for_timeout(500)

    # Add Item
    page.get_by_role("button", name="Add Item").click()
    page.wait_for_timeout(500)

    dialog_inputs = page.get_by_role("dialog").get_by_role("textbox").all()
    if dialog_inputs:
        dialog_inputs[0].fill("Hotel Paris")

    spin_inputs = page.get_by_role("spinbutton").all()
    if spin_inputs:
        spin_inputs[0].fill("200")

    page.get_by_role("button", name="Save").click()
    page.wait_for_timeout(1000)

    # Take final screenshot of group
    page.screenshot(path="/app/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/app/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
