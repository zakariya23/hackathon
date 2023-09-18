from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from seleniumwire import webdriver
import requests
from bs4 import BeautifulSoup
import time
import json
import csv
import random
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import gzip
from io import BytesIO

from psa_card import get_psa_card

if __name__ == "__main__":
    card_id = "78282755"  # or any other card ID
    result = get_psa_card(card_id)
    print(json.dumps(result, indent=4))
