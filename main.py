import requests
import json
from bs4 import BeautifulSoup

def get_psa_card(id):
    base_url = f"https://www.psacard.com/cert/{id}"
    response = requests.get(base_url)

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

    return card_details

def get_sci_data(query):
    api_url = "https://api.sportscardinvestor.com/stats/sciFreeSearch"
    params = {
        "query": query,
        "index_id": "txCV7sqVPfw1MHWh2T41GB"
    }
    response = requests.get(api_url, params=params)

    if response.status_code != 200:
        print(f"Error fetching data: {response.status_code}")
        return {}

    return response.json()

if __name__ == "__main__":
    id = "78282755"  # Replace with the ID you want to query
    card_details = get_psa_card(id)
    # print("PSA Card Details:")
    # print(json.dumps(card_details, indent=4))

    player = card_details.get("Player", "").split("/")[-1]
    year = card_details.get("Year", "")
    brand = card_details.get("Brand", "")

    query_terms = [player, year, brand]
    lowest_total = float('inf')
    final_response = {}

    for i in range(1, len(query_terms) + 1):
        for j in range(i, len(query_terms) + 1):
            query = " ".join(query_terms[i-1:j])
            sci_data = get_sci_data(query)
            total = sci_data.get("total", float('inf'))

            if total < lowest_total:
                lowest_total = total
                final_response = sci_data

            if total == 0:
                break

    # print("Sportscardinvestor Data:")
    # print(json.dumps(final_response, indent=4))

    # Add 'image_url' to original JSON if 'card_number' matches
        # Add 'image_url' to original JSON if 'card_number' matches
    if final_response.get('cards'):
        for card in final_response['cards']:
            sci_card_number = card.get('card_number', '').replace("#", "")
            psa_card_number = card_details.get('Card Number', '')
            
            if sci_card_number == psa_card_number:
                card_details['image_url'] = card.get('image_url')
                break


    # print("Updated PSA Card Details:")
    print(json.dumps(card_details, indent=4))