/**
 * TermsContent — nội dung "Điều khoản sử dụng khi đăng ký tài khoản".
 *
 * Dùng chung ở hai nơi:
 *   1. Dialog trong luồng đăng ký (app/auth/register).
 *   2. Trang độc lập /terms.
 *
 * Giữ nguyên văn bản pháp lý theo tài liệu yêu cầu (9 mục).
 */

type Section = {
  heading: string;
  /** Đoạn văn thường. */
  body?: string;
  /** Danh sách gạch đầu dòng (mục 7). */
  bullets?: string[];
};

const SECTIONS: Section[] = [
  {
    heading: '1. Chấp nhận điều khoản',
    body: 'Khi đăng ký tài khoản trên nền tảng KOLBooking, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ các Điều khoản sử dụng và Chính sách bảo mật của hệ thống. Nếu không đồng ý với bất kỳ nội dung nào, vui lòng không tiếp tục đăng ký hoặc sử dụng dịch vụ.',
  },
  {
    heading: '2. Điều kiện đăng ký',
    body: 'Người dùng phải cung cấp đầy đủ, chính xác và trung thực các thông tin đăng ký. Mỗi cá nhân hoặc tổ chức chỉ được sử dụng một tài khoản cho từng vai trò (Brand hoặc KOL). Người dùng chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động phát sinh từ tài khoản của mình.',
  },
  {
    heading: '3. Quy định đối với KOL',
    body: 'KOL có trách nhiệm cung cấp thông tin hồ sơ, số liệu mạng xã hội và các thông tin liên quan một cách chính xác. Hồ sơ KOL sẽ được hệ thống hoặc quản trị viên xem xét trước khi được kích hoạt để tham gia nhận booking. Việc cung cấp thông tin sai lệch có thể dẫn đến việc từ chối phê duyệt hoặc khóa tài khoản.',
  },
  {
    heading: '4. Quy định đối với Brand',
    body: 'Brand cam kết cung cấp thông tin doanh nghiệp hoặc cá nhân chính xác khi đăng ký, đồng thời chịu trách nhiệm đối với các chiến dịch được tạo trên nền tảng. Mọi yêu cầu booking phải tuân thủ quy định của pháp luật và không được chứa nội dung vi phạm đạo đức, bản quyền hoặc các quy định hiện hành.',
  },
  {
    heading: '5. Quy định về Booking và thanh toán',
    body: 'Các giao dịch booking được thực hiện thông qua hệ thống KOLBooking. Khoản thanh toán sẽ được giữ tạm thời cho đến khi chiến dịch hoàn thành và được nghiệm thu. Trong trường hợp phát sinh tranh chấp, quản trị viên có quyền xem xét thông tin liên quan để đưa ra quyết định xử lý theo quy định của nền tảng.',
  },
  {
    heading: '6. Sử dụng AI Assistant',
    body: 'AI Assistant được cung cấp nhằm hỗ trợ tìm kiếm và đề xuất KOL dựa trên thông tin người dùng cung cấp. Kết quả đề xuất chỉ mang tính tham khảo và không thay thế quyết định lựa chọn cuối cùng của Brand.',
  },
  {
    heading: '7. Hành vi bị nghiêm cấm',
    body: 'Người dùng không được:',
    bullets: [
      'Cung cấp thông tin giả mạo hoặc sử dụng tài khoản của người khác.',
      'Gian lận trong quá trình booking, thanh toán hoặc đánh giá.',
      'Đăng tải nội dung vi phạm pháp luật, bản quyền hoặc thuần phong mỹ tục.',
      'Can thiệp trái phép vào hoạt động của hệ thống hoặc thực hiện các hành vi gây ảnh hưởng đến nền tảng.',
    ],
  },
  {
    heading: '8. Tạm khóa hoặc chấm dứt tài khoản',
    body: 'KOLBooking có quyền tạm khóa hoặc chấm dứt tài khoản đối với người dùng vi phạm Điều khoản sử dụng, cung cấp thông tin không chính xác hoặc thực hiện các hành vi gây ảnh hưởng đến quyền lợi của người dùng khác và hoạt động của nền tảng.',
  },
  {
    heading: '9. Thay đổi điều khoản',
    body: 'KOLBooking có thể cập nhật hoặc điều chỉnh Điều khoản sử dụng khi cần thiết nhằm phù hợp với hoạt động của hệ thống và các quy định của pháp luật. Những thay đổi sẽ được thông báo trên nền tảng trước khi có hiệu lực.',
  },
];

export function TermsContent({ className }: { className?: string }) {
  return (
    <div className={className}>
      {SECTIONS.map((section) => (
        <section key={section.heading} className="mb-5 last:mb-0">
          <h3 className="font-display font-bold text-ink text-base mb-1.5">{section.heading}</h3>
          {section.body && (
            <p className="text-body text-sm leading-relaxed">{section.body}</p>
          )}
          {section.bullets && (
            <ul className="mt-1.5 space-y-1.5">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-body text-sm leading-relaxed">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-mute" aria-hidden />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
