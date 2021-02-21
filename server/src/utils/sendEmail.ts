import nodemailer from 'nodemailer'

export async function sendEmail(to: string, body: string) {
    const testAcc = await nodemailer.createTestAccount()
    console.log(testAcc)

    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587, 
        secure: false,
        auth: {
            user: testAcc.user,
            pass: testAcc.pass
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
    
        }
    }) 

    const info = await transporter.sendMail({
        from: '"lereddit@contact.com"',
        to,
        subject: 'Password Recovery',
        text: body,
    })

    console.log(`Message sent: ${info.messageId}`)
    return info

}