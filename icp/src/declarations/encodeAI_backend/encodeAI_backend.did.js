export const idlFactory = ({ IDL }) => {
  const FileId__1 = IDL.Text;
  const FileInfo = IDL.Record({
    'name' : IDL.Text,
    'size' : IDL.Nat,
    'fileId' : IDL.Text,
    'chunkCount' : IDL.Nat,
  });
  const ProposalState = IDL.Variant({
    'active' : IDL.Null,
    'cancelled' : IDL.Null,
    'approved' : IDL.Null,
  });
  const FileId = IDL.Text;
  const VectorData = IDL.Record({
    'startPos' : IDL.Int,
    'vectorId' : IDL.Text,
    'vector' : IDL.Vec(IDL.Float64),
    'documentId' : FileId,
    'endPos' : IDL.Int,
  });
  const TxReceipt = IDL.Variant({
    'ok' : IDL.Nat,
    'err' : IDL.Variant({
      'InsufficientAllowance' : IDL.Null,
      'InsufficientBalance' : IDL.Null,
      'Unauthorized' : IDL.Null,
    }),
  });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponsePayload = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HttpHeader),
  });
  const TransformArgs = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : HttpResponsePayload,
  });
  const CanisterHttpResponsePayload = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HttpHeader),
  });
  const Main = IDL.Service({
    'addDocument' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Opt(IDL.Tuple(IDL.Principal, IDL.Text, IDL.Nat))],
        [],
      ),
    'addVector' : IDL.Func(
        [
          IDL.Principal,
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          IDL.Nat,
          IDL.Vec(IDL.Float64),
        ],
        [IDL.Opt(IDL.Text)],
        [],
      ),
    'closeProposal' : IDL.Func([IDL.Nat], [], []),
    'createEmbeddings' : IDL.Func([IDL.Text], [IDL.Text], []),
    'deployDIP20' : IDL.Func([], [IDL.Principal], []),
    'documentIDToTitle' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], []),
    'getChunk' : IDL.Func(
        [FileId__1, IDL.Nat, IDL.Principal],
        [IDL.Opt(IDL.Text)],
        [],
      ),
    'getChunks' : IDL.Func([FileId__1, IDL.Principal], [IDL.Opt(IDL.Text)], []),
    'getDIP20Principal' : IDL.Func([], [IDL.Opt(IDL.Principal)], ['query']),
    'getDocumentID' : IDL.Func(
        [IDL.Text, IDL.Principal],
        [IDL.Opt(IDL.Text)],
        [],
      ),
    'getIndexInfo' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Vec(FileInfo))],
        [],
      ),
    'getPrincipal' : IDL.Func([], [IDL.Opt(IDL.Text)], []),
    'getProposalStatus' : IDL.Func(
        [IDL.Nat],
        [IDL.Record({ 'status' : IDL.Opt(ProposalState) })],
        [],
      ),
    'getProposals' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'id' : IDL.Nat,
              'method' : IDL.Text,
              'threshold' : IDL.Nat,
              'proposer' : IDL.Principal,
              'documentID' : IDL.Text,
            })
          ),
        ],
        [],
      ),
    'getVectors' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Record({ 'items' : IDL.Vec(VectorData) }))],
        [],
      ),
    'mintToken' : IDL.Func([], [TxReceipt], []),
    'titleToDocumentID' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], []),
    'transform' : IDL.Func(
        [TransformArgs],
        [CanisterHttpResponsePayload],
        ['query'],
      ),
    'vote' : IDL.Func([IDL.Nat, IDL.Bool], [], []),
    'wallet_receive' : IDL.Func([], [], []),
  });
  return Main;
};
export const init = ({ IDL }) => { return []; };
