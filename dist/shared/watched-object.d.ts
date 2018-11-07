declare class Change {
    prop: Array<any>;
    oldValue: any;
    newValue: any;
    constructor(prop: any, oldValue: any, newValue: any);
}
declare function watchObject<T extends Object>(o: T, parent: any, listener: (change: Change) => void): T;
export { watchObject, Change };
export default watchObject;
