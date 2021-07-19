import pandas as pd
import requests as req
import json

# import page exists in frontend now

params = ["ADM_RATE", "SAT_AVG", "INSTNM", "STABBR", "INSTURL"]
names = ["Admission Rate", "Average SAT", "Name", "State", "Website"]
is_data = ["true", "true", "false", "false", "false"]

dat = pd.read_csv("Most-Recent-Cohorts-All-Data-Elements.csv")

nv_list = []
temp = []
for [ind, val] in dat.iterrows():
    nv = {}
    # print(val)
    for i in range(0, 5):
        if is_data[i] == "true":
            nv[names[i]] = float(val[params[i]])
        else:
            nv[names[i]] = val[params[i]]
    # print(nv)
    temp.append(nv)
    if len(temp) == 25:
        nv_list.append(list(temp))
        temp.clear()
if not len(temp) == 0:
    nv_list.append(temp)
    temp.clear()
for nv in nv_list:
    res = json.dumps(nv)
    payload = {"entryFields": res}
    req.post("http://localhost:5000/api/table/college/add-entry", headers=payload)
