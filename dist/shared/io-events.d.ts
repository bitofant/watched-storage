declare namespace Events {
    interface Change {
        prop: Array<string>;
        value: any;
    }
    interface Changes extends Array<Change> {
    }
    interface Initialize extends Array<any> {
    }
    interface EventNames {
        initialize: string;
        changes: string;
    }
    function eventNames(eventPrefix: string): EventNames;
    function convertChanges(changes: Array<{
        prop: string[];
        oldValue: any;
        newValue: any;
    }>): Changes;
}
export { Events };
export default Events;
