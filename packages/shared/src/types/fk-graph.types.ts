/**
 * Represents a single foreign key relationship between two tables.
 */
export interface FkRelationship {
  /** Child table (the one with the FK column) */
  from: string;
  /** FK column on the child table */
  fromCol: string;
  /** Parent table being referenced */
  to: string;
  /** Referenced column on the parent table (usually `id`) */
  toCol: string;
  /** ON DELETE behavior as declared in Postgres */
  onDelete: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
}

/**
 * Full column descriptor for a table.
 */
export interface ColumnInfo {
  name: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
}

/**
 * A table with its columns — the node in the schema graph.
 */
export interface TableSchema {
  name: string;
  columns: ColumnInfo[];
}

/**
 * Response shape for GET /schema
 */
export interface SchemaResponse {
  tables: TableSchema[];
  relationships: FkRelationship[];
}
