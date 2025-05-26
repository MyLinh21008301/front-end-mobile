// TimeUtils.js - Utility function để format thời gian theo yêu cầu
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  const messageDate = new Date(timestamp);
  const now = new Date();
  
  // Reset time to 00:00:00 để so sánh ngày chính xác
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  // Tính số ngày chênh lệch
  const diffTime = today.getTime() - msgDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Format giờ phút (24h format)
  const timeString = messageDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  if (diffDays === 0) {
    // Hôm nay - chỉ hiển thị giờ
    return timeString;
  } else if (diffDays === 1) {
    // Hôm qua
    return `Hôm qua ${timeString}`;
  } else if (diffDays === 2) {
    // Hôm kia
    return `Hôm kia ${timeString}`;
  } else if (diffDays >= 3 && diffDays <= 7) {
    // 3-7 ngày trước
    return `${diffDays} ngày trước ${timeString}`;
  } else {
    // Hơn 7 ngày - hiển thị ngày tháng năm
    const dateString = messageDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${dateString} ${timeString}`;
  }
};