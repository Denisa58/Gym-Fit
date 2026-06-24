using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Text;

namespace GymFit.services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(_configuration["EmailSettings:SenderEmail"]));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;
            email.Body = new TextPart(TextFormat.Html) { Text = body };

            using var smtp = new SmtpClient();

            // Conectare la serverul SMTP (Gmail) cu setările din appsettings
            smtp.Connect(
                _configuration["EmailSettings:SmtpServer"],
                int.Parse(_configuration["EmailSettings:Port"]),
                SecureSocketOptions.StartTls
            );

            // Autentificare cu emailul și App Password-ul tău
            smtp.Authenticate(
                _configuration["EmailSettings:Username"],
                _configuration["EmailSettings:Password"]
            );

            smtp.Send(email);
            smtp.Disconnect(true);

            return Task.CompletedTask;
        }
    }
}
