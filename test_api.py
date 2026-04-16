import requests

url = "http://localhost:8000/audit-jd"
data = { 
    'title': 'Senior Software Engineer',
    'description': 'We are looking for a rockstar ninja developer! Must be assertive and aggressive'
}

try:
    response = requests.post(url, data=data, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
