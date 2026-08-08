import urllib.request

urls = ['http://127.0.0.1:8000/openapi.json', 'http://127.0.0.1:8000/api/upload/statement']
for url in urls:
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            print(url, '=>', r.status)
            print(r.read(200).decode('utf-8', 'ignore'))
    except Exception as e:
        print(url, '=> ERROR', e)
