import { Change } from "./watched-object";
declare function observedStorage<T>(callback: (changes: Change[]) => void, initialData?: Array<T>): Array<T>;
declare function applyChange<T>(store: Array<T>, prop: Array<string>, newValue: T): void;
export { observedStorage, applyChange };
export default observedStorage;
