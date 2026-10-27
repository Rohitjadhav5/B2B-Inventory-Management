// StatusBadge – maps order status strings to visual badge classes
const statusClassMap = {
  'Pending Delivery': 'badge badge-pending',
  Shipped:           'badge badge-shipped',
  Delivered:         'badge badge-delivered',
  Cancelled:         'badge badge-cancelled',
  vendor:            'badge badge-vendor',
  manager:           'badge badge-manager',
};

const StatusBadge = ({ status }) => (
  <span className={statusClassMap[status] || 'badge'}>
    {status}
  </span>
);

export default StatusBadge;
