import pandas as pd
import requests as req
import json

params = ["ADM_RATE", "SAT_AVG", "INSTNM", "STABBR", "INSTURL"]
names = ["Admission Rate", "Average SAT", "Name", "State", "Website"]
is_data = ["true", "true","false", "false", "false"]

ent = req.get("http://localhost:5000/api/table/college/entries").json()

for val in ent:
    nv = {}
    for i in range(0, 5):
        p = names[i]
        if val[p] is None:
            if is_data[i]:
                nv[p] = -1
            else:
                nv[p] = "N/A"
        else:
            nv[p] = val[p]
    res = json.dumps(nv)
    payload = {"entryFields" : res}
    req.put("http://localhost:5000/api/table/college/" + str(val["id"]) + "/edit", headers = payload)



