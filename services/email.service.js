const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendGrid = (options) => {
  console.log('### agent email id: ', process.env.AGENT_EMAIL_ID);
  return new Promise((resolve, reject) => {
    return sgMail.send({
      from: process.env.AGENT_EMAIL_ID,
      to: options.to,
      subject: options.subject,
      html: options.html
    }).then((res) => resolve(res)).catch((err) => reject(err));
  });
}