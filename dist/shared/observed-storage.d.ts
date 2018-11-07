import { Change } from "./watched-object";
declare function observedStorage<T>(callback: (changes: Change[]) => void): Array<T>;
declare function applyChange(store: Array<any>, prop: Array<string>, newValue: any): void;
export { observedStorage, applyChange };
export default observedStorage;
