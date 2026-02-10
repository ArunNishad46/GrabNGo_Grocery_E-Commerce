import Brevo from '@getbrevo/brevo';
import dotenv from 'dotenv'
dotenv.config()

if(!process.env.BREVO_API){
    console.log("Provide BREVO_API in side the .env file")
}
    
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API);

const sendEmail = async({sendTo, subject, html })=>{
    try {
        const emailData = {
            sender: { name: "GrabNGo", email: "arunnishad731022@gmail.com" },
            to: [{ email: sendTo }],
            subject: subject,
            htmlContent: html
        };
        const { data, error } = await apiInstance.sendTransacEmail(emailData);

        if (error) {
            return console.error({ error });
        }

        return data
    } catch (error) {
        console.log(error)
    }
}

export default sendEmail

