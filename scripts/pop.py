import pandas as pd
import requests as req
import json

params = ["ADM_RATE", "SAT_AVG", "INSTNM", "STABBR", "INSTURL"]
names = ["Admission Rate", "Average SAT", "Name", "State", "Website"]
is_data = ["true", "true","false", "false", "false"]

for i in range(100, 151): 
    req.delete("http://localhost:5000/api/table/college/"+str(i)+"/delete")

dat = pd.read_csv("Most-Recent-Cohorts-All-Data-Elements.csv")

for [ind, val] in dat.iterrows():
    nv = {}
    # print(val)
    for i in range(0, 5):
        if is_data[i] == "true":
            nv[names[i]] = float(val[params[i]])
        else:
            nv[names[i]] = val[params[i]]
    # print(nv)
    res = json.dumps(nv)
    payload = {"entryFields" : res}
    req.post("http://localhost:5000/api/table/college/add-entry", headers = payload)