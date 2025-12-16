# Spec 

- Ở ngoài đời thật chúng ta có một trò chơi đoán trúng quà VÀ người tặng quà sẽ nhận được quà. Lần lượt mọi người theo vòng tròn sẽ đoán, nhằm giảm độ khó ta cần xây dựng một webapp thời gian thực đơn giản để giúp người đoán sai và những người khác nhận manh mối, bằng cách mọi người trả lời câu hỏi một cách ẩn danh. Câu hỏi là "Bạn A đã chọn đúng quà hoặc nguời tặng quà đúng không ?", có 2 câu trả lời cố định là "Không rõ" và "Đúng một phần" (ở ngoài đời thực nếu đúng hoàn toàn sẽ nhận quà và qua lượt)

## Quy tắc chơi:
- Chỉ có 1 room global duy nhất, khi mọi người vào homepage sẽ tự động tham gia vào (connection)
- Mỗi UUID chỉ được kết nối 1 lần. Nếu mở nhiều tab với cùng UUID, kết nối thứ 2 sẽ bị từ chối với thông báo "Duplicate connection detected. Please close other tabs."
- Bất kỳ ai cũng có thể đề xuất khởi động lượt bằng cách nhập tên của mình và nhấn đề xuất (tên đó sẽ hiển thị trong câu hỏi)
- Khi có người đề xuất, số người hiện tại tại thời điểm đó sẽ được lưu lại làm ngưỡng. Sẽ có 10s đếm ngược cho giai đoạn bỏ phiếu
- Cần >= 50% số người đó nhấn đồng ý (Tick) để khởi động lượt. Số phiếu được cập nhật realtime cho tất cả mọi người khi có người bỏ phiếu
- Nếu hết 10s mà chưa đủ phiếu, lượt sẽ bị hủy và quay về trạng thái chờ
- Người chơi có thể xem phiếu bầu của chính mình (Đồng ý/Từ chối) sau khi bỏ phiếu
- Khi lượt bắt đầu sẽ có 10s đếm ngược để mọi người trả lời câu hỏi. Người đề xuất chỉ được xem, không được trả lời. Người nào disconnect hoặc không trả lời mặc định là "Không rõ"
- Khi kết thúc thời gian trả lời sẽ tính toán kết quả. Kết quả: khi có ít nhất một người trả lời "Đúng một phần", kết quả sẽ là "Đúng một phần" ngược lại là "Không rõ"
- Kết quả công khai trên màn hình toàn bộ người chơi và hiển thị trong vòng 10s sau đó kết thúc lượt và room trở về trạng thái chờ

## Quản lý người chơi:
- Tối đa có 30 người chơi, hãy tạo 30 cái tên các loài động vật (tiếng Việt) để random gán cho họ, nếu người thứ 31 tham gia sẽ bị từ chối tham gia (từ chối connect)
- **Quản lý tên động vật (pool system)**:
  - Server duy trì một pool (kho) chứa 30 tên động vật unique
  - Khi người chơi mới tham gia: Lấy ngẫu nhiên một tên từ pool còn trống và gán cho người chơi đó
  - Tên động vật phải unique - không được trùng lặp giữa các người chơi đang online
  - Khi người chơi disconnect và timeout (> 1 phút): Tên động vật được trả lại vào pool để có thể sử dụng lại
  - Khi người chơi reconnect trong vòng 1 phút: Giữ nguyên tên động vật đã gán (không lấy từ pool)
- Mỗi người chơi được gán một UUID v4 duy nhất, lưu trong localStorage để định danh
- Khi reconnect/refresh trong vòng 1 phút, gửi UUID lên server để:
  - Định danh người chơi (giữ nguyên tên động vật đã gán)
  - Tránh trả lời 2 lần trong cùng một lượt
  - Đồng bộ lại câu trả lời đã submit nếu đã trả lời trước khi disconnect
- Timeout disconnect: Nếu người chơi disconnect quá 1 phút, server sẽ xóa UUID, trả tên động vật về pool và coi như phiên kết thúc. Khi connect lại sau đó, người chơi sẽ nhận UUID mới và tên động vật mới từ pool, frontend phải lưu lại vào localStorage (ghi đè UUID cũ)
- Cho phép người chơi reconnect/refresh và tham gia ngay cả khi đang có lượt chơi đang diễn ra

## Lưu trữ dữ liệu:
- Không cần lưu trữ data persistence trên server (tất cả dữ liệu chỉ tồn tại trong memory)
- Frontend: Lưu UUID v4 trong localStorage để định danh người chơi qua các lần reconnect/refresh

## Giao diện:
- Concept: flat UI đơn giản giống shadcn, toàn bộ app sử dụng tiếng Việt
- Layout:
  - Phía trên cùng là navbar: một góc có button hiển thị số người đang tham gia realtime, nhấn vào sẽ trigger Sheet của shadcn hiện ra danh sách người chơi (hiển thị tên động vật)
  - Phía trên là màn hình chính hiển thị nội dung theo trạng thái
  - Phía dưới là các nút thao tác hình vuông bo tròn

## Trạng thái màn hình chính:

### 1. Trạng thái chờ (WAITING):
- Hiển thị: "Xin chào tên <tên động vật random>"
- Nút thao tác: "Giúp tôi tìm manh mối" để đề xuất bắt đầu lượt (khi nhấn sẽ hiện input để nhập tên)

### 2. Trạng thái đang bỏ phiếu (VOTING):
- Hiển thị: 
  - Tên người đề xuất
  - Đếm ngược thời gian (10s) - màu đỏ và nhấp nháy khi còn <= 3s
  - Số phiếu hiện tại/tổng (cập nhật realtime)
  - Sau khi bỏ phiếu: hiển thị lựa chọn của mình (Đồng ý/Từ chối) với màu sắc phân biệt
- Nút thao tác: 
  - Nút X (Từ chối) - màu đỏ khi được chọn, có viền ring-offset
  - Nút Tick (Đồng ý) - màu xanh khi được chọn, có viền ring-offset
  - Nút không được chọn sẽ mờ đi (opacity-40)

### 3. Trạng thái đang trả lời (ANSWERING):
- Hiển thị: 
  - Câu hỏi: "Bạn <tên người đề xuất> đã chọn đúng quà hoặc người tặng quà đúng không?"
  - Đếm ngược thời gian (10s)
  - Số lượt đã trả lời realtime (ví dụ: "5/10 người đã trả lời")
- Nút thao tác:
  - Nếu là người đề xuất: Hiển thị "Bạn là người đề xuất - Chỉ có thể xem, không được trả lời"
  - Nếu không phải người đề xuất:
    - "Không rõ"
    - "Đúng một phần"

### 4. Trạng thái hiển thị kết quả (RESULTS):
- Hiển thị:
  - Kết quả cuối cùng: "Đúng một phần" hoặc "Không rõ"
  - Đếm số mỗi kết quả (ví dụ: "Đúng một phần: 3 người", "Không rõ: 7 người")
  - Đếm ngược thời gian (10s)
  - Lưu ý: Không hiển thị câu trả lời cụ thể của từng người (giữ tính ẩn danh)

## Flow hoạt động:
1. Người chơi vào homepage → Tự động connect và gửi UUID từ localStorage (nếu có)
2. Server kiểm tra UUID:
   - Nếu UUID hợp lệ và disconnect < 1 phút: Giữ nguyên UUID và tên động vật đã gán (không lấy từ pool)
   - Nếu UUID không hợp lệ hoặc disconnect >= 1 phút: 
     * Tạo UUID mới
     * Lấy một tên động vật ngẫu nhiên từ pool còn trống và gán cho người chơi
     * Tên đó được đánh dấu là đã sử dụng (không còn trong pool)
3. Frontend lưu UUID mới vào localStorage (ghi đè nếu có UUID cũ)
4. Server gửi UUID và tên động vật về client
5. Trạng thái WAITING: Người chơi có thể đề xuất bắt đầu lượt
6. Khi có đề xuất → Chuyển sang trạng thái VOTING, lưu số người hiện tại làm ngưỡng
7. Mọi người bỏ phiếu (X hoặc Tick), số phiếu cập nhật realtime
8. Khi >= 50% đồng ý → Chuyển sang trạng thái ANSWERING, bắt đầu đếm ngược 10s
9. Người chơi trả lời câu hỏi (mỗi người chỉ trả lời 1 lần)
10. Hết thời gian → Tính kết quả và chuyển sang trạng thái RESULTS
11. Hiển thị kết quả 10s → Quay về trạng thái WAITING

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

# Cấu trúc dự án (monorepo)
2 thư mục backend và frontend

# Công nghệ:
- Lang: Typescript

- Frontend:
  - Vite + React (full CSR) build ra static site host lên Cloudflare pages
  - TailwindCSS
  - Shadcn

- Backend:
  - Bun
  - Socket
  - Docker: build ra image deploy lên ec2



