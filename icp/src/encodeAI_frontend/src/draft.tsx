import { useState } from "react";
import { encodeAI_backend } from "../../declarations/encodeAI_backend";
import { LocalDocumentIndex } from "./lib/db/LocalDocumentIndex";
import { Colorize } from "./utils/Colorize";
import { Principal } from "@dfinity/principal";

function App() {
  const [title, setTitle] = useState("");
  const [principal, setPrincipal] = useState("");
  const [text, setText] = useState("");

  const loadIsCatalog = async (principal: any) => {
    if (!principal) {
      return;
    }
    const info = await encodeAI_backend.getIndexInfo(principal);

    if (info.length > 0) {
      return true;
    } else {
      false;
    }
  };

  const getDocumentID = async (title: string) => {
    let responseCID;
    try {
      const info = await encodeAI_backend.titleToDocumentID(title);
      responseCID = info[0];
    } catch (e) {
      console.log(e);
    }
    return responseCID;
  };
  const getDocumentTitle = async (docId: string) => {
    let responseCID = "";
    try {
      const info = await encodeAI_backend.titleToDocumentID(docId);
      if (info[0]) {
        responseCID = info[0];
      }
    } catch (e) {
      console.log(e);
    }
    return responseCID;
  };

  async function _addDocument(title: string, text: string) {
    let chunkSize = 502;
    const _principal = await encodeAI_backend.getPrincipal();

    if (_principal[0]) {
      setPrincipal(_principal[0])
      const principal = Principal.fromText(_principal[0]);

      const isCatalog = await loadIsCatalog(principal);
      const indexInstance = new LocalDocumentIndex({
        indexName: _principal[0],
        isCatalog: isCatalog,
        _getDocumentId: getDocumentID,
        _getDoumentUri: getDocumentTitle,
        chunkingConfig: {
          chunkSize: chunkSize,
        },
      });
      let id: string | undefined;
      let documentResult;
      try {
        documentResult = await indexInstance.upsertDocument(title, text);

        id = documentResult.id;

        console.log(Colorize.replaceLine(Colorize.success(`added "${title}"`)));
      } catch (err: unknown) {
        console.log(
          Colorize.replaceLine(
            Colorize.error(
              `Error adding: "${title}"\n${(err as Error).message}`
            )
          )
        );
      }
      return { title, id };
    }
  }

  const addDocument = async () => {
    //let's try out the add document feature
    const res = await _addDocument(title, text);

    console.log(res);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[100vh] bg-gray-100">
      <img src="/logo2.svg" alt="DFINITY logo" className="mb-6" />

      <div className="w-full max-w-lg h-full">
        <input
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="Enter title of document"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-48"
          placeholder="Enter text of document"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={addDocument}
        >
          Add Document
        </button>
      </div>

      <h1 className="text-3xl font-bold underline text-red-500 mt-6">
        {principal ?? ""} uu
      </h1>
    </main>
  );
}

export default App;
