// ERROR FIX: Firebase database type declarations
// Fix for: Could not find a declaration file for module 'firebase/database'
declare module 'firebase/database' {
  export interface DataSnapshot {
    exists(): boolean;
    val(): any;
    key: string | null;
    ref: DatabaseReference;
  }

  export interface DatabaseReference {
    key: string | null;
    parent: DatabaseReference | null;
    root: DatabaseReference;
  }

  export function ref(database: any, path?: string): DatabaseReference;
  export function get(ref: DatabaseReference): Promise<DataSnapshot>;
  export function set(ref: DatabaseReference, value: any): Promise<void>;
  export function update(ref: DatabaseReference, values: any): Promise<void>;
  export function push(ref: DatabaseReference, value?: any): DatabaseReference;
  export function onValue(
    ref: DatabaseReference, 
    callback: (snapshot: DataSnapshot) => void,
    errorCallback?: (error: any) => void
  ): () => void;
  export function off(ref: DatabaseReference, eventType?: string, callback?: any): void;
  export function getDatabase(app?: any): any;
  export function query(ref: DatabaseReference, ...constraints: any[]): any;
  export function orderByChild(path: string): any;
  export function equalTo(value: any): any;
  export function remove(ref: DatabaseReference): Promise<void>;
}