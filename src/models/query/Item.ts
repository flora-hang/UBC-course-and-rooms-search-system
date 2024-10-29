export default abstract class Item {
    // Common properties or methods can be defined here if needed
    // For example, a unique identifier or shared functionality

	public abstract getField(comparisonField: string): any;
	public abstract getUniqueIdentifier(): string;
}
