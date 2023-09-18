from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from bs4 import BeautifulSoup
import os
from urllib.request import urlretrieve
from flask import send_from_directory
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from seleniumwire import webdriver
import time
import gzip
from io import BytesIO
import subprocess
import json
from psa_card import get_psa_card

app = Flask(__name__)
CORS(app)

# Store PSA data temporarily
psa_data_cache = {}

@app.route('/store_psa_data', methods=['POST'])
def store_psa_data():
    data = request.json
    psa_id = data.get('psa_id')
    psa_data = data.get('psa_data')
    psa_data_cache[psa_id] = psa_data
    return jsonify({'status': 'success'})

@app.route('/get_psa_data/<psa_id>', methods=['GET'])
def get_psa_data(psa_id):
    return jsonify(psa_data_cache.get(psa_id, {}))


@app.route('/get_card_details', methods=['POST'])
def get_card_details_route():
    id = request.json['id']
    card_details = get_psa_card(id)

    image_url = card_details.get('image_url')
    if image_url:
        local_image_path = os.path.join('static', f"{id}.png")
        local_image_path = local_image_path.replace('\\', '/')
        card_details['local_image_url'] = f"http://127.0.0.1:5000/{local_image_path}"
        print(f"Downloading from: {image_url}")  # Debug line
        print(f"Saving to: {local_image_path}")  # Debug line
        urlretrieve(image_url, local_image_path)

        # Check if the image was saved successfully
        if os.path.exists(local_image_path):
            print(f"Successfully saved to {local_image_path}")  # Debug line
            card_details['local_image_url'] = f"http://127.0.0.1:5000/{local_image_path}"
        else:
            print(f"Failed to save the image to {local_image_path}")  # Debug line

    return jsonify(card_details)


if __name__ == '__main__':
    app.run(debug=True)
