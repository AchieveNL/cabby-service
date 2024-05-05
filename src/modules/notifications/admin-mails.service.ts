import { readFile } from 'fs/promises';
import path from 'path';
import { mailSender } from '@/config/mailer.config';

const generateEmail = async (
  email: string,
  subject: string,
  text: string,
  html: string
) => {
  try {
    const data = await readFile(
      path.join(__dirname, '../../../public/templates/email_template.html'),
      'utf8'
    );

    // Typecast data to string
    const template = data as unknown as string;

    // Replace placeholders in the HTML template
    const replacedHtml = template
      .replace('{{title}}', subject)
      .replace('{{content}}', text)
      .replace('{{subcontent}}', '')
      .replace('{{action}}', '');

    return {
      to: email,
      from: 'no-reply@cabbyrentals.nl',
      subject,
      text,
      html: replacedHtml,
    };
  } catch (err) {
    console.error('Error reading file:', err);
    throw err; // Propagate the error
  }
};

export default class AdminMailService {
  async optMailSender(email: string, otp: string) {
    const mailMessage = await generateEmail(
      email,
      'Your OTP for Cabby Rentals',
      `Your OTP for Cabby Rentals is: ${otp}. It will expire in 15 minutes.`,
      `
    <strong>Your OTP for Cabby Rentals is:</strong> 
    <h2>${otp}</h2>
    <p>This OTP will expire in 15 minutes.</p>
  `
    );

    await mailSender(mailMessage);
  }

  async AdminMailsSender(email: string, name: string) {
    const mailMessage = await generateEmail(
      email,
      'Nieuwe Registratie - Actie Vereist',
      `Nieuwe Registratie - Actie Vereist`,
      `
      Beste Admin,

      Er heeft zich zojuist een nieuwe gebruiker geregistreerd op het Cabby-platform. De naam van de nieuwe gebruiker is ${name} en ze hebben succesvol hun registratieproces voltooid.

      We willen je op de hoogte stellen van deze nieuwe registratie zodat je actie kunt ondernemen om hun registratie te verifiëren en goed te keuren. Controleer de ingediende gegevens om ervoor te zorgen dat alles in orde is.
      
      Als je vragen hebt of verdere informatie nodig hebt, laat het ons dan weten.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async newRegistrationMailSender(email: string, name: string) {
    const mailMessage = await generateEmail(
      email,
      'Nieuwe Registratie - Actie Vereist',
      `Nieuwe Registratie - Actie Vereist`,
      `
      Beste Admin,

      Er heeft zich zojuist een nieuwe gebruiker geregistreerd op het Cabby-platform. De naam van de nieuwe gebruiker is ${name} en ze hebben succesvol hun registratieproces voltooid.

      We willen je op de hoogte stellen van deze nieuwe registratie zodat je actie kunt ondernemen om hun registratie te verifiëren en goed te keuren. Controleer de ingediende gegevens om ervoor te zorgen dat alles in orde is.
      
      Als je vragen hebt of verdere informatie nodig hebt, laat het ons dan weten.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async rentCanceledMailSender(
    email: string,
    name: string,
    vehicleNumber: string
  ) {
    const mailMessage = await generateEmail(
      email,
      'Huur Geannuleerd - Actie Vereist',
      `Huur Geannuleerd - Actie Vereist`,
      `
      Beste Admin,

      We willen je informeren dat een gebruiker zojuist hun huurperiode heeft geannuleerd. De huurder is ${name} en de annulering heeft plaatsgevonden voor voertuig ${vehicleNumber}.

      Neem contact op met de huurder om de reden voor de annulering te achterhalen en om eventuele verdere acties te coördineren.
      
      Als je vragen hebt of hulp nodig hebt bij het afhandelen van deze annulering, staan we klaar om te assisteren.
      
      Team Cabby 
  `
    );

    await mailSender(mailMessage);
  }

  async rentStartedMailSender(
    email: string,
    name: string,
    vehicleNumber: string
  ) {
    const mailMessage = await generateEmail(
      email,
      'Huur Gestart - Actie Vereist',
      `Huur Gestart - Actie Vereist`,
      `
      Beste Admin,

      We willen je laten weten dat een gebruiker zojuist hun huurperiode heeft gestart. De huurder is ${name} en ze zijn begonnen met het gebruik van voertuig ${vehicleNumber}.

      Dit is slechts een melding om je op de hoogte te stellen van deze huurstart. Controleer regelmatig het systeem voor verdere updates en details met betrekking tot deze huurperiode.
      
      Als je vragen hebt of assistentie nodig hebt, laat het ons dan weten.
      
      Team Cabby
      
      
  `
    );

    await mailSender(mailMessage);
  }

  async rentCompletedMailSender(
    email: string,
    name: string,
    vehicleNumber: string
  ) {
    const mailMessage = await generateEmail(
      email,
      'Huur Gestart - Actie Vereist',
      `Huur Gestart - Actie Vereist`,
      `
      Beste Admin,

      We willen je laten weten dat een gebruiker zojuist hun huurperiode heeft gestart. De huurder is ${name} en ze zijn begonnen met het gebruik van voertuig ${vehicleNumber}.

      Dit is slechts een melding om je op de hoogte te stellen van deze huurstart. Controleer regelmatig het systeem voor verdere updates en details met betrekking tot deze huurperiode.
      
      Als je vragen hebt of assistentie nodig hebt, laat het ons dan weten.

      Team Cabby
      
  `
    );

    await mailSender(mailMessage);
  }

  async damageReportMailSender(
    email: string,
    name: string,
    vehicleNumber: string
  ) {
    const mailMessage = await generateEmail(
      email,
      'Schademelding Ontvangen - Actie Vereist*',
      `Schademelding Ontvangen - Actie Vereist*`,
      `
      Beste Admin,

      We willen je informeren dat we een schademelding hebben ontvangen van een gebruiker. De huurder is ${name} en ze hebben aangegeven dat er schade is aan voertuig ${vehicleNumber}.

      Gelieve deze melding te onderzoeken en de nodige stappen te ondernemen om de schade te   beoordelen en te repareren.

      Als je vragen hebt of assistentie nodig hebt bij het afhandelen van deze schademelding, aarzel dan niet om contact met ons op te nemen.

      Team Cabby 
  `
    );

    await mailSender(mailMessage);
  }

  async accountDeletedMailSender(email: string, name: string) {
    const mailMessage = await generateEmail(
      email,
      'Account Verwijderd - Actie Vereist',
      `Account Verwijderd - Actie Vereist`,
      `
      Beste Admin,

      We willen je informeren dat een gebruiker zojuist hun Cabby-account heeft verwijderd. De gebruiker is ${name} en ze hebben ervoor gekozen om hun account permanent te sluiten.

      Dit is slechts een melding om je op de hoogte te stellen van deze accountverwijdering. Mocht je verdere informatie nodig hebben of als er actie vereist is, neem dan gerust contact met ons op.
      
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async paymentIssuesMailSender(email: string, paymentErrorMessage: string) {
    const mailMessage = await generateEmail(
      email,
      'Betalingsprobleem - Actie Vereist',
      `Betalingsprobleem - Actie Vereist`,
      `
      Beste Admin,

      We hebben een melding ontvangen van een betalingsprobleem van een gebruiker. De gebruiker heeft ${paymentErrorMessage} gemeld met betrekking tot hun recente transactie.

      Graag verzoeken we je om dit probleem te onderzoeken en passende maatregelen te nemen om het op te lossen.
      
      Als je verdere informatie nodig hebt of als er aanvullende acties vereist zijn, aarzel dan niet om contact met ons op te nemen.
      
      Team Cabby   
  `
    );

    await mailSender(mailMessage);
  }

  async userFeedbackMailSender(email: string, userFeedback: string) {
    const mailMessage = await generateEmail(
      email,
      'Gebruikersfeedback - Lees de Feedback van Onze Gebruikers',
      `Gebruikersfeedback - Lees de Feedback van Onze Gebruikers`,
      `
      Beste Admin,

      We willen graag je aandacht vestigen op enkele recente feedback die we hebben ontvangen van onze gebruikers. Hier zijn enkele opmerkingen en suggesties die we hebben verzameld:

      ${userFeedback}

      We waarderen het delen van feedback door onze gebruikers, aangezien dit ons helpt om onze service te verbeteren. Neem de tijd om deze opmerkingen te lezen en overweeg eventuele  verbeteringen die kunnen worden doorgevoerd.

      Team Cabby

  `
    );

    await mailSender(mailMessage);
  }

  async accountSuspendedMailSender(
    email: string,
    name: string,
    reason: string
  ) {
    const mailMessage = await generateEmail(
      email,
      'Account Geblokkeerd - Actie Vereist',
      `Account Geblokkeerd - Actie Vereist`,
      `
      Beste Admin,

      We hebben onlangs een gebruikersaccount geblokkeerd. De betreffende gebruiker is ${name} en de reden voor de accountblokkering is ${reason}.

      Het is belangrijk om deze blokkering te onderzoeken en te bepalen of verdere maatregelen of communicatie nodig zijn om het probleem op te lossen.
      
      Als je vragen hebt of assistentie nodig hebt bij het beheren van deze accountblokkering, staan we voor je klaar.
      
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async vehicleMaintenanceMailSender(
    email: string,
    vehicleNumber: string,
    specificMaintainanceRequirement: string
  ) {
    const mailMessage = await generateEmail(
      email,
      'Voertuigonderhoud - Actie Vereist',
      `Voertuigonderhoud - Actie Vereist`,
      `
      Beste Admin,

      We willen je informeren dat een van onze voertuigen onderhoud nodig heeft. Het betreft voertuig ${vehicleNumber} en de aard van het benodigde onderhoud is ${specificMaintainanceRequirement}.

      Graag verzoeken we je om deze kwestie te coördineren en het benodigde onderhoud te plannen om de voertuigen in optimale staat te houden.
      
      Als je verdere details nodig hebt of hulp nodig hebt bij het regelen van het onderhoud, aarzel dan niet om contact met ons op te nemen.
      
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async billingInquiriesMailSender(email: string, specificQuestion: string) {
    const mailMessage = await generateEmail(
      email,
      'Factuurvragen - Actie Vereist',
      `Factuurvragen - Actie Vereist`,
      `
      Beste Admin, 

      We hebben een vraag ontvangen met betrekking tot een factuur van een gebruiker. Ze hebben ${specificQuestion} met betrekking tot hun recente transactie.

      We vragen je vriendelijk om deze factuurvraag te onderzoeken en indien nodig te reageren met de benodigde informatie of verduidelijking.
      
      Als je verdere details nodig hebt of als er aanvullende acties vereist zijn, laat het ons dan weten.
      
      Team Cabby
      
      
  `
    );

    await mailSender(mailMessage);
  }

  async driverDocumentationMailSender(
    email: string,
    name: string,
    specificDocument: string
  ) {
    const mailMessage = await generateEmail(
      email,
      'Ontbrekende Chauffeursdocumentatie - Actie Vereist',
      `Ontbrekende Chauffeursdocumentatie - Actie Vereist`,
      `
      Beste Admin,

      We willen je op de hoogte stellen dat een van onze chauffeurs ontbrekende documentatie heeft. De chauffeur is ${name} en de ontbrekende documenten betreffen ${specificDocument}.

      Het is van essentieel belang dat we de ontbrekende documentatie van onze chauffeurs aanvullen om de naleving van de vereisten te waarborgen. Graag vragen we je om deze kwestie op te volgen en contact op te nemen met de betreffende chauffeur om de ontbrekende documenten te verkrijgen.
      
      Als je verdere details nodig hebt of assistentie nodig hebt bij het coördineren van dit proces, staan we voor je klaar.
      
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async emergencyAlertsMailSender(email: string, description: string) {
    const mailMessage = await generateEmail(
      email,
      'Noodwaarschuwing - Onmiddellijke Actie Vereist',
      `Noodwaarschuwing - Onmiddellijke Actie Vereist`,
      `
      Beste Admin,

      We willen je op de hoogte stellen van een noodsituatie die zich heeft voorgedaan. ${description}.

      Het is van het grootste belang dat we snel handelen om deze noodsituatie aan te pakken en de veiligheid en welzijn van onze gebruikers en chauffeurs te waarborgen.

      Graag verzoeken we je om onmiddellijk actie te ondernemen volgens de vastgestelde protocollen  en procedures.   
  `
    );

    await mailSender(mailMessage);
  }

  async driverPerformanceMailSender(email: string, feedback: string) {
    const mailMessage = await generateEmail(
      email,
      'Chauffeursprestaties - Feedback en Beoordelingen',
      `Chauffeursprestaties - Feedback en Beoordelingen`,
      `
      We willen graag de aandacht vestigen op de prestaties van onze chauffeurs. Hier zijn enkele recente feedback en beoordelingen van passagiers:
      ${feedback}
      Het is van groot belang dat we de prestaties van onze chauffeurs volgen en waar nodig verbeteringen aanbrengen. Neem de tijd om deze feedback en beoordelingen te bekijken en overweeg eventuele maatregelen voor verbetering.
      
      Team Cabby      
  `
    );

    await mailSender(mailMessage);
  }
}
