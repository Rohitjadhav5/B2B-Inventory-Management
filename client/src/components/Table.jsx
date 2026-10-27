// Table – simple wrapper that renders headers and rows
// columns: [{ key, label, render? }]
// data: array of objects
const Table = ({ columns, data, emptyMessage = 'No data found.' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="table-wrapper">
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p className="empty-title">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || i}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
