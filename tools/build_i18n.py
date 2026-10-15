import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from i18n_en import EN; from i18n_zh import ZH_CN; from i18n_ja import JA; from i18n_ko import KO
from i18n_fr import FR; from i18n_de import DE; from i18n_es import ES; from i18n_ms import MS; from i18n_vi import VI
import opencc
cc = opencc.OpenCC('s2twp')
TW = {k: cc.convert(v) for k, v in ZH_CN.items()}
fix = {"合並":"合併","數字商品":"數位商品","交付視窗":"交付時限","服務端":"伺服器端","在本地跑":"在本機跑","模板":"範本","這臺":"這台"}
for k, v in TW.items():
    for a, b in fix.items(): v = v.replace(a, b)
    TW[k] = v
ALL = {"en":EN,"zh-CN":ZH_CN,"zh-TW":TW,"ja":JA,"ko":KO,"ms":MS,"vi":VI,"fr":FR,"es":ES,"de":DE}
root = os.path.join(os.path.dirname(__file__), "..", "i18n")
for f in os.listdir(root): os.remove(os.path.join(root, f))
for code, d in ALL.items():
    miss = set(EN) ^ set(d)
    assert not miss, (code, miss)
    json.dump(d, open(os.path.join(root, f"{code}.json"), "w"), ensure_ascii=False, indent=1)
print("ok", len(ALL), len(EN))
