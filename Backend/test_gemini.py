import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load the GEMINI_API_KEY from your .env file
load_dotenv()

# Configure the SDK
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in .env file.")
    exit(1)

genai.configure(api_key=api_key)

print("Connecting to Gemini API...")

try:
    # Initialize the model Cursor just wired up
    model = genai.GenerativeModel('gemini-3.6-flash')
    
    # Send a tiny, low-token test prompt
    response = model.generate_content("Respond with exactly one word: Success.")
    
    print(f"Response from Gemini: {response.text.strip()}")
    print("Connection verified. You are ready to process PDFs.")
    
except Exception as e:
    print(f"Connection failed: {e}")