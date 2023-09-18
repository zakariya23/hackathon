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

# Function to create a proxy dictionary from a proxy string
def create_proxy_dict(proxy):
    components = proxy.split(":")
    if len(components) < 4:
        print("Failed to create proxy dictionary: not enough values to unpack")
        return {}
    host = components[0]
    port = components[1]
    user_pass = ":".join(components[2:])
    user, password = user_pass.split(":")
    return {
        'http': f'http://{user}:{password}@{host}:{port}/',
        'https': f'https://{user}:{password}@{host}:{port}/',
        'no_proxy': 'localhost,127.0.0.1'
    }

def get_random_proxy():
    with open('proxies.csv', mode ='r') as file:
        csvFile = csv.DictReader(file)
        proxies = [row['proxy'] for row in csvFile]

    return random.choice(proxies)

def get_psa_card(id):
    # Fetching card details from PSA
    base_url = f"https://www.psacard.com/cert/{id}"
    response = requests.get(base_url, timeout=10)

    if response.status_code != 200:
        print(f"Error fetching data: {response.status_code}")
        return {}

    soup = BeautifulSoup(response.text, "html.parser")
    table = soup.find('table', {'class': 'table table-fixed table-header-right text-medium'})
    rows = table.find_all('tr')
    card_details = {}

    for row in rows:
        cells = row.find_all(['th', 'td'])
        key = cells[0].text.strip()
        value = cells[1].text.strip()
        card_details[key] = value

    print(card_details)

    # Selenium part
    random_proxy = get_random_proxy()
    proxy_options = create_proxy_dict(random_proxy)

    if not proxy_options:
        print("Invalid proxy settings. Exiting.")
        return {}

    chrome_options = Options()
    chrome_options.add_argument("--headless")
    driver = webdriver.Chrome(options=chrome_options)
    driver.get("https://www.sportscardinvestor.com/")
    # Close popup
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "button.mfp-close"))
    ).click()

    # Extract details from PSA data to create a search query
    player_name = card_details.get("Player", "").split("/")[-1]
    year = card_details.get("Year", "")
    brand = card_details.get("Brand", "")
    card_number = "#" + card_details.get("Card Number", "")

     # Build search query
    words = [player_name, year, brand]
    query = ""

    for word in words:
        # Add next word to search query
        query += word + " "

        # Locate the search box and type the query
        input_box = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "sci_search"))
        )
        input_box.clear()
        input_box.send_keys(query)
        input_box.send_keys(Keys.RETURN)

        time.sleep(3)  # Allow time for the API calls to finish

        # Check requests being made
        for request in driver.requests:
            if request.response:
                try:
                    if "https://api.sportscardinvestor.com/stats/sciFreeSearch?query=" in request.url:

                        if 'gzip' in request.response.headers.get('Content-Encoding', ''):
                            # The content is gzipped; unzip it
                            buffer = BytesIO(request.response.body)
                            with gzip.GzipFile(fileobj=buffer) as f:
                                response_body = json.loads(f.read().decode('utf-8'))
                        else:
                            response_body = json.loads(request.response.body.decode('utf-8'))

                        for card in response_body.get("cards", []):
                            if card.get("card_number") == card_number:
                                card_details["image_url"] = card.get("image_url")

                except UnicodeDecodeError:
                    print("Unable to decode the response. It might be binary or gzipped data.")
                    continue  # Skip this loop iteration and proceed to the next
    driver.quit()
    return card_details
