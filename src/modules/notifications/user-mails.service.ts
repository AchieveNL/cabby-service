import { mailSender } from '@/config/mailer.config';

const generateEmail = (
  email: string,
  subject: string,
  text: string,
  html: string
) => {
  return {
    to: email,
    from: 'no-reply@cabbyrentals.nl',
    subject,
    text,
    html,
  };
};

export default class UserMailService {
  async optMailSender(email: string, otp: string) {
    const mailMessage = generateEmail(
      email,
      'Your OTP for Cabby Rentals',
      `Your OTP for Cabby Rentals is: ${otp}. It will expire in 15 minutes.`,
      `
        <strong>Your OTP for Cabby Rentals is:</strong> 
        <h2>${otp}</h2>
        <p>This OTP will expire in 15 minutes.</p>
      `
    );
    console.log('OTP email sent successfully.', otp);

    await mailSender(mailMessage);
  }

  /// beste user or $P{name}
  async accountDeletedMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      'Account Verwijderd - Actie Vereist',
      `Account Verwijderd - Actie Vereist`,
      `
      Beste ${name},

      We willen je informeren dat een gebruiker zojuist hun Cabby-account heeft verwijderd. De gebruiker is ${name} en ze hebben ervoor gekozen om hun account permanent te sluiten.

      Dit is slechts een melding om je op de hoogte te stellen van deze accountverwijdering. Mocht je verdere informatie nodig hebben of als er actie vereist is, neem dan gerust contact met ons op.
      
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async driverSideMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Inschrijving`,
      'Onderwerp: Welkom bij Cabby - Borg Betaling Gelukt!',
      `
      Beste ${name},

      Welkom bij Cabby, waar jouw reis begint met gemak en
      betrouwbaarheid! We willen je hartelijk bedanken voor het
      voltooien van je registratie en het succesvol betalen van de
      borg. Bij Cabby geloven we in een naadloze reiservaring, en we
      zijn verheugd dat je deel uitmaakt van onze community.
      Geniet van de rit!
      
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async driverApprovedMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Bestuurder Goedgekeurd`,
      'Onderwerp: Jouw Cabby Account is Goedgekeurd!',
      `
      Beste ${name},
      Fantastisch nieuws - je Cabby-account is nu officieel
      goedgekeurd. Je hebt nu de sleutel tot een wereld van
      mogelijkheden om taxi's te huren met gemak. Welkom aan
      boord van het Cabby-team!
      Op weg naar nieuwe avonturen!
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async driverRejectedMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Bestuurder Afgekeurd`,
      'Onderwerp: Belangrijke Update over je Cabby Account',
      `
      Beste ${name},
      Het spijt ons dat we je moeten informeren dat je Cabby-account
      is afgekeurd vanwege deingediende documenten onvolledig
      waren. We begrijpen dat dit teleurstellend nieuws kan zijn, maar
      we staan altijd klaar om te helpen en eventuele vragen te
      beantwoorden.
      We hopen je in de toekomst weer te mogen begroeten.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async driverBlockedMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Bestuurder Geblokkeerd`,
      'Onderwerp: Belangrijke Mededeling - Je Cabby Account is Geblokkeerd',
      `
      Beste ${name},
      Helaas hebben we moeten besluiten om je Cabby-account te
      blokkeren vanwege een overtreding van ons gebruikersbeleid.
      We begrijpen dat dit een ongemak kan zijn, en we staan klaar
      om eventuele vragen te beantwoorden.
      De weg kan soms hobbelig zijn, maar we wachten op je
      terugkeer.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async refundMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Terugbetaling`,
      'Onderwerp: Terugbetaling Verwerkt',
      `
      Beste ${name},
      Goed nieuws! We hebben zojuist een terugbetaling verwerkt
      voor je recente transactie. Je kunt de details van de
      terugbetaling in je account bekijken. Bedankt voor je geduld en
      begrip.
      Geniet van de extra kilometers!
      Team Cabby

  `
    );

    await mailSender(mailMessage);
  }

  async rentStartedMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Verhuur Gestart`,
      'Onderwerp: Jouw Cabby Verhuur is Gestart!',
      `
      Beste ${name},
      Het avontuur begint nu! Jouw huurperiode met Cabby is zojuist
      gestart. Spring in de taxi en geniet van de rit. We wensen je een
      geweldige tijd op de weg.
      Laat de rit beginnen!
      Team Cabby

  `
    );

    await mailSender(mailMessage);
  }

  async rentCanceledMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Verhuur Geannuleerd`,
      'Onderwerp: Jouw Cabby Verhuur is Geannuleerd      ',
      `
      Beste ${name},
      Het spijt ons te horen dat je je recente huurperiode hebt
geannuleerd vanwege een wijziging in de planning. We
begrijpen dat plannen kunnen veranderen, en we zijn hier om te
helpen bij toekomstige ritten.
Soms is het beste avontuur het volgende avontuur
      Team Cabby

  `
    );

    await mailSender(mailMessage);
  }

  async rentCompletedMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Verhuur Afgerond`,
      'Onderwerp: Jouw Cabby Verhuur is Afgerond',
      `
      Beste ${name},
      Gefeliciteerd! Je hebt je huurperiode met succes afgerond.
      Bedankt dat je voor Cabby hebt gekozen. We hopen dat je een
      geweldige reis hebt gehad en kijken uit naar je volgende rit.
      Het einde van de reis is het begin van het volgende avontuur.
      Team Cabby

  `
    );

    await mailSender(mailMessage);
  }

  async damageReportEnteredMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Schaderapport Ingevoerd`,
      'Onderwerp: Schaderapport Ontvangen',
      `
      Beste ${name},
      Bedankt voor het indienen van je schaderapport. Ons team zal
      dit zo snel mogelijk bekijken en contact met je opnemen voor
      verdere stappen. We waarderen je eerlijkheid en medewerking.
      Elke reis heeft zijn uitdagingen, maar samen vinden we
      oplossingen.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async driverBlockedOnacceptabelMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Onacceptabel Rijgedrag      `,
      'Onderwerp: Belangrijke Mededeling - Je Cabby Account is Geblokkeerd ',
      `
      Beste ${name},
      Helaas hebben we moeten besluiten om je Cabby-account te
      blokkeren vanwege ernstig onacceptabel rijgedrag. We hebben
      vastgesteld dat je met onze voertuigen op gevaarlijke
      snelheden hebt gereden en je schuldig hebt gemaakt aan
      ernstig roekeloos rijgedrag.
      Veiligheid op de weg staat bij ons voorop, en we nemen
      maatregelen om ervoor te zorgen dat onze voertuigen
      verantwoord worden gebruikt.
      Deze maatregel is genomen om de veiligheid van alle
      weggebruikers te waarborgen. Als je van mening bent dat er
      een misverstand is of als je vragen hebt, aarzel dan niet om
      contact met ons op te nemen.
      We hopen dat je begrip hebt voor deze beslissing.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async driverBlockedSchendingMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Schending van Vertrouwelijkheid en  Privacy`,
      'Onderwerp: Belangrijke Mededeling - Je Cabby Account is Geblokkeerd',
      `
      Beste ${name},
      Helaas moeten we je informeren dat we je Cabby-account
      hebben geblokkeerd vanwege ernstige schendingen van
      vertrouwelijkheid en privacy. We hebben geconstateerd dat je
      kentekenkaarten, die we verstrekken voor het aanmelden van
      voertuigen, hebt gedeeld met derden zonder toestemming. Dit
      vormt een ernstige schending van onze privacyregels en het
      vertrouwen dat we in al onze chauffeurs stellen.
      We nemen privacy en vertrouwelijkheid zeer serieus, en
      dergelijk gedrag kan niet worden getolereerd op ons platform.
      Als je denkt dat er sprake is van verwarring of als je vragen
      hebt, neem dan contact met ons op.
      We hopen dat je begrijpt dat deze beslissing is genomen om de
      integriteit van ons platform te beschermen.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async driverBlockedOngeldigeMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Ongeldige of Verlopen Vergunning`,
      'Onderwerp: Belangrijke Mededeling - Je Cabby Account is Geblokkeerd',
      `
      Beste ${name},
      Het spijt ons te moeten meedelen dat we je Cabby-account
      hebben geblokkeerd vanwege een ongeldige of verlopen
      vergunning. We hebben vastgesteld dat je niet langer beschikt
      over de vereiste vergunning om als taxichauffeur te werken. Dit
      kan onder meer te wijten zijn aan het feit dat je chauffeurskaart
      is verlopen of ingetrokken.
      We willen ervoor zorgen dat al onze chauffeurs voldoen aan de
      wettelijke vereisten om veilig te opereren. Als je denkt dat er
      een misverstand is of als je vragen hebt, aarzel dan niet om
      contact met ons op te nemen.
      We hopen dat je begrip hebt voor deze maatregel.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async driverBlockedHerhaaldeMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Herhaalde Schendingen van Gebruiksvoorwaarden`,
      'Onderwerp: Belangrijke Mededeling - Je Cabby Account is Geblokkeerd',
      `
      Beste ${name},
      Het spijt ons te moeten meedelen dat we je Cabby-account
      hebben geblokkeerd vanwege herhaalde schendingen van
      onze gebruiksvoorwaarden. Dit omvat ongepast gedrag en
      overtredingen van de regels die meerdere keren zijn
      voorgekomen. Deze herhaalde schendingen hebben geleid tot
      ernstige bezorgdheid over de veiligheid en integriteit van ons
      platform.
      We streven naar een veilige en respectvolle omgeving voor al
      onze gebruikers. Als je denkt dat er sprake is van een
      vergissing of als je vragen hebt, aarzel dan niet om contact met
      ons op te nemen.
      We hopen dat je begrijpt dat deze beslissing is genomen om de
      algemene veiligheid van ons platform te waarborgen.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async driverBlockedVoertuigproblemenMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Voertuigproblemen`,
      'Onderwerp: Belangrijke Mededeling - Je Cabby Account is Geblokkeerd',
      `
      Beste ${name},
      Het spijt ons te moeten meedelen dat we je Cabby-account
      hebben geblokkeerd vanwege voertuigproblemen. We hebben
      herhaalde meldingen ontvangen dat je opzettelijk schade hebt
      toegebracht aan de voertuigen die je via onze app hebt
      gehuurd. Dit omvat situaties waarin je het gehuurde voertuig
      niet adequaat hebt onderhouden of in een slechte staat hebt
      teruggebracht.
      We willen ervoor zorgen dat al onze voertuigen in goede staat
      verkeren en veilig kunnen worden gebruikt door andere
      chauffeurs. Als je denkt dat er een misverstand is of als je
      vragen hebt, aarzel dan niet om contact met ons op te nemen.
      We hopen dat je begrijpt dat deze maatregel is genomen om de
      integriteit van ons platform te beschermen.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }

  async driverBlockedFraudeMailSender(email: string, name: string) {
    const mailMessage = generateEmail(
      email,
      `Fraude`,
      'Onderwerp: Belangrijke Mededeling - Je Cabby Account is Geblokkeerd',
      `
      Beste ${name},
      Het spijt ons te moeten meedelen dat we je Cabby-account
      hebben geblokkeerd vanwege fraude.
      Na een grondig onderzoek hebben we vastgesteld dat je
      betrokken was bij frauduleuze activiteiten, waaronder het
      verstrekken van valse identiteitsgegevens en het gebruik van
      vervalste documenten.
      Fraude ondermijnt het vertrouwen in ons platform en kan niet
      worden getolereerd. We nemen maatregelen om de integriteit
      van ons platform te beschermen. Als je denkt dat er sprake is
      van verwarring of als je vragen hebt, aarzel dan niet om contact
      met ons op te nemen.
      We hopen dat je begrijpt dat deze beslissing is genomen om de
      algemene veiligheid en eerlijkheid van ons platform te
      waarborgen.
      Team Cabby
  `
    );

    await mailSender(mailMessage);
  }
}
