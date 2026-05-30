# Test results for NeatDuck v1.0.7

Run date: 2026-05-30

Commands executed:

```bash
python -m py_compile scripts/update_data.py tests/csv_python_contract.py
node --check extension/background.js extension/content.js extension/core.js extension/info.js extension/popup.js extension/standalone.js
python tests/csv_python_contract.py tests/out/python_events.csv
javac tests/EventCsvContract.java -d tests/out
java -cp tests/out EventCsvContract tests/out/java_events.csv
node tests/node_csv_contract.js tests/out/node_events.csv
cmp -s tests/out/python_events.csv tests/out/java_events.csv
cmp -s tests/out/python_events.csv tests/out/node_events.csv
node -e "...parse data/events.csv with LDT_Core.csvToEvents and reject Mega Mega..."
```

Result: all checks passed.

The Python, Java, and extension JavaScript CSV contract outputs are byte-for-byte identical for the shared test fixtures.
