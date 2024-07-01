import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CanisterHttpResponsePayload {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export type FileId = string;
export type FileId__1 = string;
export interface FileInfo {
  'name' : string,
  'size' : bigint,
  'fileId' : string,
  'chunkCount' : bigint,
}
export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpResponsePayload {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export interface Main {
  'addDocument' : ActorMethod<
    [string, string],
    [] | [[Principal, string, bigint]]
  >,
  'addVector' : ActorMethod<
    [Principal, string, string, bigint, bigint, Array<number>],
    [] | [string]
  >,
  'closeProposal' : ActorMethod<[bigint], undefined>,
  'createEmbeddings' : ActorMethod<[string], string>,
  'deployDIP20' : ActorMethod<[], Principal>,
  'documentIDToTitle' : ActorMethod<[string], [] | [string]>,
  'getChunk' : ActorMethod<[FileId__1, bigint, Principal], [] | [string]>,
  'getChunks' : ActorMethod<[FileId__1, Principal], [] | [string]>,
  'getDIP20Principal' : ActorMethod<[], [] | [Principal]>,
  'getDocumentID' : ActorMethod<[string, Principal], [] | [string]>,
  'getIndexInfo' : ActorMethod<[Principal], [] | [Array<FileInfo>]>,
  'getPrincipal' : ActorMethod<[], [] | [string]>,
  'getProposalStatus' : ActorMethod<
    [bigint],
    { 'status' : [] | [ProposalState] }
  >,
  'getProposals' : ActorMethod<
    [],
    Array<
      {
        'id' : bigint,
        'method' : string,
        'threshold' : bigint,
        'proposer' : Principal,
        'documentID' : string,
      }
    >
  >,
  'getVectors' : ActorMethod<
    [Principal],
    [] | [{ 'items' : Array<VectorData> }]
  >,
  'mintToken' : ActorMethod<[], TxReceipt>,
  'titleToDocumentID' : ActorMethod<[string], [] | [string]>,
  'transform' : ActorMethod<[TransformArgs], CanisterHttpResponsePayload>,
  'vote' : ActorMethod<[bigint, boolean], undefined>,
  'wallet_receive' : ActorMethod<[], undefined>,
}
export type ProposalState = { 'active' : null } |
  { 'cancelled' : null } |
  { 'approved' : null };
export interface TransformArgs {
  'context' : Uint8Array | number[],
  'response' : HttpResponsePayload,
}
export type TxReceipt = { 'ok' : bigint } |
  {
    'err' : { 'InsufficientAllowance' : null } |
      { 'InsufficientBalance' : null } |
      { 'Unauthorized' : null }
  };
export interface VectorData {
  'startPos' : bigint,
  'vectorId' : string,
  'vector' : Array<number>,
  'documentId' : FileId,
  'endPos' : bigint,
}
export interface _SERVICE extends Main {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
