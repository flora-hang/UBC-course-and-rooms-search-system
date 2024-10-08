export default interface IFilter {
    buildQuery(object: any): IFilter; 
    // checkId(id: string): void;
}