# Spec (Phiên bản xúc tích)

Webapp thời gian thực giúp người chơi nhận manh mối bằng cách trả lời câu hỏi ẩn danh. Câu hỏi: "Bạn A đã chọn đúng quà hoặc người tặng quà đúng không?" với 2 đáp án: "Không rõ" và "Đúng một phần".

## Quy tắc chơi:
- 1 room global, tự động tham gia khi vào homepage
- Bất kỳ ai cũng có thể đề xuất lượt (nhập tên, tên hiển thị trong câu hỏi)
- Đề xuất: Lưu số người hiện tại làm ngưỡng, cần >= 50% đồng ý (Tick) để bắt đầu. Cập nhật số phiếu realtime
- Trả lời: 10s đếm ngược, ai không trả lời/disconnect mặc định "Không rõ"
- Kết quả: Có >= 1 "Đúng một phần" → "Đúng một phần", ngược lại → "Không rõ"
- Hiển thị kết quả 10s, sau đó về trạng thái chờ

## Quản lý người chơi:
- Tối đa 30 người, 30 tên động vật (tiếng Việt). Người thứ 31 bị từ chối
- **Pool tên động vật**:
  - Pool 30 tên unique, lấy ngẫu nhiên khi có người mới
  - Tên phải unique giữa các người đang online
  - Disconnect > 1 phút: Trả tên về pool
  - Reconnect < 1 phút: Giữ nguyên tên
- UUID v4 lưu trong localStorage
- Reconnect < 1 phút: Giữ UUID, tên, tránh trả lời 2 lần, đồng bộ câu trả lời đã submit
- Disconnect > 1 phút: Xóa UUID, trả tên về pool. Connect lại nhận UUID và tên mới, lưu vào localStorage
- Cho phép reconnect/refresh ngay cả khi đang có lượt chơi

## Lưu trữ dữ liệu:
- Server: Không persistence, chỉ lưu trong memory
- Frontend: UUID v4 trong localStorage

## Giao diện:
- Flat UI giống shadcn, toàn bộ tiếng Việt
- Layout: Navbar (button số người → Sheet danh sách) / Màn hình chính / Nút thao tác (vuông bo tròn)

## Trạng thái màn hình:

### WAITING:
- Hiển thị: "Xin chào tên <tên động vật>"
- Nút: "Giúp tôi tìm manh mối" (hiện input nhập tên)

### VOTING:
- Hiển thị: Tên người đề xuất, số phiếu hiện tại/tổng (realtime)
- Nút: X (Từ chối), Tick (Đồng ý)

### ANSWERING:
- Hiển thị: Câu hỏi, đếm ngược 10s, số người đã trả lời (realtime)
- Nút: "Không rõ", "Đúng một phần"

### RESULTS:
- Hiển thị: Kết quả cuối cùng, đếm số mỗi kết quả, đếm ngược 10s
- Lưu ý: Không hiển thị câu trả lời cụ thể (giữ ẩn danh)

## Flow hoạt động:
1. Connect → Gửi UUID từ localStorage (nếu có)
2. Server kiểm tra UUID:
   - Hợp lệ + disconnect < 1 phút: Giữ UUID và tên
   - Không hợp lệ hoặc >= 1 phút: Tạo UUID mới, lấy tên từ pool
3. Lưu UUID vào localStorage
4. WAITING → Đề xuất lượt
5. VOTING → Lưu số người làm ngưỡng, bỏ phiếu (realtime)
6. >= 50% đồng ý → ANSWERING (10s)
7. Trả lời câu hỏi (1 lần/người)
8. Hết thời gian → Tính kết quả → RESULTS (10s)
9. Quay về WAITING

## Socket Events (tham khảo):
- `connect`: Kết nối vào room, gửi UUID (nếu có)
- `player-joined`: Thông báo người chơi mới tham gia
- `player-left`: Thông báo người chơi rời khỏi
- `propose-round`: Đề xuất bắt đầu lượt mới
- `vote-round`: Bỏ phiếu đồng ý/từ chối
- `round-started`: Lượt chơi bắt đầu
- `submit-answer`: Gửi câu trả lời
- `answer-updated`: Cập nhật số người đã trả lời
- `round-ended`: Lượt chơi kết thúc, gửi kết quả
- `state-sync`: Đồng bộ trạng thái khi reconnect

# Cấu trúc dự án
Monorepo: backend, frontend

# Công nghệ:
- Typescript
- Frontend: Vite + React (CSR), TailwindCSS, Shadcn → Cloudflare Pages
- Backend: Bun + Socket → Docker → EC2

