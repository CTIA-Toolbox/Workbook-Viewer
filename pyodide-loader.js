// pyodide-loader.js
// Minimal Pyodide wrapper for: bytes (.pkl) -> pandas DataFrame -> JSON-friendly records.
//
// Extend later:
// - Move Pyodide into a Web Worker to keep UI ultra responsive.
// - Add schema validation and column mapping UI.
// - Support multiple pickle formats or alternative sources.

let pyodidePromise = null;

export async function getPyodide() {
  if (pyodidePromise) return pyodidePromise;

  // `loadPyodide` is provided by the script tag in index.html.
  if (typeof loadPyodide !== 'function') {
    throw new Error('Pyodide failed to load. Check the CDN script in index.html');
  }

  pyodidePromise = (async () => {
    const pyodide = await loadPyodide({
      // You can set indexURL if you self-host the Pyodide distribution later.
      // indexURL: "./pyodide/"
    });

    // pandas is not guaranteed to be preloaded; load it explicitly.
    // You can add more packages here later if your pickles require them.
    await pyodide.loadPackage(['pandas']);

    return pyodide;
  })();

  return pyodidePromise;
}

export async function unpickleDataFrameToRecords(pklBytes) {
  // pklBytes: Uint8Array
  const pyodide = await getPyodide();

  // Pass bytes into Python.
  pyodide.globals.set('PKL_BYTES', pklBytes);

  const code = `
import io
import pickle

import pandas as pd


# Robust compatibility layer for pickles created in different NumPy versions.
#
# Problem:
# - Some pickles reference internal module paths like "numpy._core.numeric" (NumPy 2.x)
# - But the runtime might only have "numpy.core.numeric" (NumPy 1.x)
#
# Solution:
# - Remap module names during unpickling (more reliable than sys.modules aliasing).

_MODULE_REMAP = {
    'numpy._core': 'numpy.core',
    'numpy._core.numeric': 'numpy.core.numeric',
    'numpy._core.multiarray': 'numpy.core.multiarray',
    'numpy._core._multiarray_umath': 'numpy.core._multiarray_umath',
}


class CompatUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        module = _MODULE_REMAP.get(module, module)
        if module.startswith('numpy._core.'):
            module = 'numpy.core.' + module[len('numpy._core.'):]
        return super().find_class(module, name)


bio = io.BytesIO(PKL_BYTES.to_py())
obj = CompatUnpickler(bio).load()

# Expecting a pandas DataFrame pickled directly.
# If your file pickles a dict or other structure, extend logic here.
if isinstance(obj, pd.DataFrame):
    df = obj
else:
    raise TypeError(f"Pickle does not contain a pandas DataFrame (got: {type(obj)})")

# Make sure column labels are JSON-serializable.
columns = [str(c) for c in df.columns.tolist()]

# Convert to JSON-friendly structure.
# orient='records' gives a list of dicts: [{col: value, ...}, ...]
records_json = df.to_json(orient='records')

# Returning a Python dict lets Pyodide convert to JS without
# creating a giant intermediate JSON string (reduces peak memory).
{"columns": columns, "records": df.to_dict(orient='records')}
`;

  try {
    const resultProxy = await pyodide.runPythonAsync(code);
    let result = resultProxy.toJs({ create_proxies: false });
    resultProxy.destroy();

    // Pyodide converts Python dicts to JS Maps by default.
    // Our callers expect a plain object with { columns, records }.
    if (result instanceof Map) result = Object.fromEntries(result);
    if (!result || typeof result !== 'object') {
      throw new Error('Unpickle conversion failed: unexpected result type');
    }
    if (!Array.isArray(result.columns) || !Array.isArray(result.records)) {
      throw new Error('Unpickle conversion failed: missing columns/records arrays');
    }

    // Pyodide also converts nested dicts (each record) into Maps.
    // Normalize them so callers can use record[colName] everywhere.
    result.records = result.records.map((r) => (r instanceof Map ? Object.fromEntries(r) : r));

    return result;
  } finally {
    // Clean up globals to reduce memory pressure.
    if (pyodide.globals.has('PKL_BYTES')) {
      pyodide.globals.delete('PKL_BYTES');
    }
  }
}
