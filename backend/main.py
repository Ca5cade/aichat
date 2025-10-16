from dotenv import load_dotenv
load_dotenv()

import os
import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:3000",  # Allow frontend origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DATABASE_URL = "postgresql://neondb_owner:npg_RGkMFvA1IBO9@ep-little-rain-ag18ph4g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

def create_messages_table():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            "sessionId" TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    cur.close()
    conn.close()

# Create table on startup
create_messages_table()

# Google AI configuration
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

for m in genai.list_models():
  if 'generateContent' in m.supported_generation_methods:
    print(m.name)

# In-memory chat history
chat_sessions = {}

class ChatRequest(BaseModel):
    messages: list
    sessionId: str

@app.get("/api/chat")
def get_chat_history(sessionId: str):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute('SELECT role, content FROM messages WHERE "sessionId" = %s ORDER BY "createdAt" ASC', (sessionId,))
        messages = cur.fetchall()
        cur.close()
        conn.close()
        return {"messages": [{"role": row[0], "content": row[1]} for row in messages]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def post_chat_message(chat_request: ChatRequest):
    try:
        user_message = chat_request.messages[-1]
        session_id = chat_request.sessionId

        # Get or create chat session
        if session_id not in chat_sessions:
            model = genai.GenerativeModel('gemini-pro-latest')
            chat_sessions[session_id] = model.start_chat(history=[])

        chat_session = chat_sessions[session_id]

        # Save user message to database
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO messages ("sessionId", role, content) VALUES (%s, %s, %s)',
            (session_id, user_message['role'], user_message['content'])
        )
        conn.commit()

        # Generate AI response
        response = chat_session.send_message(user_message['content'])

        # Save AI response to database
        cur.execute(
            'INSERT INTO messages ("sessionId", role, content) VALUES (%s, %s, %s)',
            (session_id, 'assistant', response.text)
        )
        conn.commit()
        cur.close()
        conn.close()

        return {"message": response.text}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))