from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle, numpy as np
from datetime import datetime, timedelta

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LOAD MODELS
disease_model = pickle.load(open("../model/disease.pkl","rb"))
severity_model = pickle.load(open("../model/severity.pkl","rb"))
columns = pickle.load(open("../model/columns.pkl","rb"))

# STORAGE
patients_db = []
reports_db = []

# USERS
users = {
    "doctor1": "doctor",
    "nurse1": "nurse"
}

# ================= MODELS =================

class LoginRequest(BaseModel):
    user_id: str

class PatientRequest(BaseModel):
    name: str
    symptoms: list
    duration: int
    age: int

class CompleteRequest(BaseModel):
    name: str
    report: str

# ================= HELPERS =================

def symptoms_to_vector(symptoms):
    vec = [0]*len(columns)
    for s in symptoms:
        s = s.lower().strip()
        for col in columns:
            if s in col:   # partial match fix
                vec[columns.index(col)] = 1
    return np.array([vec])

def score(sev,dur,age):
    return (sev*60)+(dur*4)+(age*0.3)

def action(sev):
    return ["Stay Home","Consult Doctor","Emergency"][sev]

def treat_time(sev):
    return [5,15,30][sev]

def assign(data):
    t=0
    now=datetime.now()
    for p in data:
        p["wait_time"]=t
        p["appointment_time"]=(now+timedelta(minutes=t)).strftime("%H:%M")
        t+=treat_time(p["severity"])
    return data

# ================= ROUTES =================

@app.post("/login")
def login(data: LoginRequest):
    role = users.get(data.user_id.strip())
    return {"role": role if role else "invalid"}

@app.post("/add_patient")
def add(p: PatientRequest):
    patients_db.append(p.dict())
    return {"msg":"added"}

@app.get("/queue")
def queue():
    res=[]
    for p in patients_db:
        v=symptoms_to_vector(p["symptoms"])
        d=disease_model.predict(v)[0]
        s=int(severity_model.predict(v)[0])

        res.append({
            "name":p["name"],
            "disease":d,
            "severity":s,
            "score":score(s,p["duration"],p["age"]),
            "action":action(s)
        })

    res=sorted(res,key=lambda x:x["score"],reverse=True)
    return assign(res)

@app.post("/complete")
def complete(data: CompleteRequest):
    global patients_db,reports_db

    patients_db=[p for p in patients_db if p["name"]!=data.name]

    reports_db.append({
        "name":data.name,
        "report":data.report,
        "time":datetime.now().strftime("%H:%M")
    })

    return {"msg":"done"}

@app.get("/reports")
def reports():
    return reports_db