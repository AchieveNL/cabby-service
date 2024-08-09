/* eslint-disable @typescript-eslint/dot-notation */
import * as mindee from 'mindee';
import ProfileService from '../profile/profile.service';
import prisma from '@/lib/prisma';

export class ThirdPartyService {
  private readonly mindeeClient: mindee.Client;
  private readonly userProfileService = new ProfileService();

  constructor() {
    this.mindeeClient = new mindee.Client({
      apiKey: process.env.MINDEE_API_KEY as string,
    });
  }

  async extractDataFromImage(userId: string): Promise<any> {
    try {
      const userProfile = await this.userProfileService.getByUserId(userId);
      if (!userProfile?.driverLicense) {
        throw new Error('User profile or driver license data not found');
      }

      const {
        driverLicenseFront,
        driverLicenseBack,
        bsnNumber,
        driverLicenseExpiry,
      } = userProfile.driverLicense;

      const existingData = {
        existingFirstName: userProfile.firstName,
        existingLastName: userProfile.lastName,
        existingBsnNumber: bsnNumber,
        existingDateOfBirth: userProfile.dateOfBirth,
        existingExpiryDate: driverLicenseExpiry,
      };

      console.log(existingData);

      if (!driverLicenseFront || !driverLicenseBack) {
        throw new Error('Driver license images not found');
      }

      const customEndpointFront = this.mindeeClient.createEndpoint(
        'driving_license_v1',
        'Cabby'
      );
      const customEndpointBack = this.mindeeClient.createEndpoint(
        'driver_bsn',
        'Cabby'
      );

      const frontInputSource = this.mindeeClient.docFromUrl(driverLicenseFront);
      const frontResponse = await this.mindeeClient.parse(
        mindee.product.CustomV1,
        frontInputSource,
        { endpoint: customEndpointFront }
      );
      const backInputSource = this.mindeeClient.docFromUrl(driverLicenseBack);
      const backResponse = await this.mindeeClient.parse(
        mindee.product.CustomV1,
        backInputSource,
        { endpoint: customEndpointBack }
      );

      const extractField = (fieldData) => {
        if (fieldData?.values && fieldData.values.length > 0) {
          return fieldData.values[0].content;
        }
        return null;
      };

      const extractedData = {
        firstName: extractField(
          frontResponse.document.inference.prediction.fields['first_name']
        ),
        lastName: extractField(
          frontResponse.document.inference.prediction.fields['last_name']
        ),
        extractedBsnNumber: extractField(
          backResponse.document.inference.prediction.fields['bsn']
        ),
        dateOfBirth: extractField(
          frontResponse.document.inference.prediction.fields['date_of_birth']
        ),
        expiryDate: extractField(
          frontResponse.document.inference.prediction.fields['expiry_date']
        ),
      };

      const isFirstNameMatch = Boolean(
        extractedData.firstName &&
          extractedData.firstName === userProfile.firstName
      );
      const isLastNameMatch = Boolean(
        extractedData.lastName &&
          extractedData.lastName === userProfile.lastName
      );

      const isExpiryDateMatch = Boolean(
        extractedData.expiryDate &&
          extractedData.expiryDate === driverLicenseExpiry
      );
      const isBsnNumberMatch = Boolean(
        extractedData.extractedBsnNumber &&
          extractedData.extractedBsnNumber === bsnNumber
      );
      const isDateOfBirthMatch = Boolean(
        extractedData.dateOfBirth &&
          extractedData.dateOfBirth === userProfile.dateOfBirth
      );

      const verificationRecord = await prisma.userVerification.create({
        data: {
          userProfileId: userProfile.id,
          isLastNameMatch,
          isFirstNameMatch,
          isExpiryDateMatch,
          isBsnNumberMatch,
          isDateOfBirthMatch,
          extractedFirstName: extractedData.firstName,
          extractedLastName: extractedData.lastName,
          extractedBsnNumber: extractedData.extractedBsnNumber,
          extractedDateOfBirth: extractedData.dateOfBirth,
          extractedExpiryDate: extractedData.expiryDate,

          // Save existing user profile data
          ...existingData,
        },
      });

      return verificationRecord;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Error in processing driver license: ${error}`);
    }
  }

  async extractDataFromImageById(userId: string): Promise<any> {
    try {
      const userProfile = await this.userProfileService.getById(userId);
      if (!userProfile?.driverLicense) {
        throw new Error('User profile or driver license data not found');
      }

      const {
        driverLicenseFront,
        driverLicenseBack,
        bsnNumber,
        driverLicenseExpiry,
      } = userProfile.driverLicense;

      const existingData = {
        existingFirstName: userProfile.firstName,
        existingLastName: userProfile.lastName,
        existingBsnNumber: bsnNumber,
        existingDateOfBirth: userProfile.dateOfBirth,
        existingExpiryDate: driverLicenseExpiry,
      };

      console.log(existingData);

      if (!driverLicenseFront || !driverLicenseBack) {
        throw new Error('Driver license images not found');
      }

      const customEndpointFront = this.mindeeClient.createEndpoint(
        'driving_license_v1',
        'Cabby'
      );
      const customEndpointBack = this.mindeeClient.createEndpoint(
        'driver_bsn',
        'Cabby'
      );

      const frontInputSource = this.mindeeClient.docFromUrl(driverLicenseFront);
      const frontResponse = await this.mindeeClient.parse(
        mindee.product.CustomV1,
        frontInputSource,
        { endpoint: customEndpointFront }
      );
      const backInputSource = this.mindeeClient.docFromUrl(driverLicenseBack);
      const backResponse = await this.mindeeClient.parse(
        mindee.product.CustomV1,
        backInputSource,
        { endpoint: customEndpointBack }
      );

      const extractField = (fieldData) => {
        if (fieldData?.values && fieldData.values.length > 0) {
          return fieldData.values[0].content;
        }
        return null;
      };

      const extractedData = {
        firstName: extractField(
          frontResponse.document.inference.prediction.fields['first_name']
        ),
        lastName: extractField(
          frontResponse.document.inference.prediction.fields['last_name']
        ),
        extractedBsnNumber: extractField(
          backResponse.document.inference.prediction.fields['bsn']
        ),
        dateOfBirth: extractField(
          frontResponse.document.inference.prediction.fields['date_of_birth']
        ),
        expiryDate: extractField(
          frontResponse.document.inference.prediction.fields['expiry_date']
        ),
      };

      const isFirstNameMatch = Boolean(
        extractedData.firstName &&
          extractedData.firstName === userProfile.firstName
      );
      const isLastNameMatch = Boolean(
        extractedData.lastName &&
          extractedData.lastName === userProfile.lastName
      );

      const isExpiryDateMatch = Boolean(
        extractedData.expiryDate &&
          extractedData.expiryDate === driverLicenseExpiry
      );
      const isBsnNumberMatch = Boolean(
        extractedData.extractedBsnNumber &&
          extractedData.extractedBsnNumber === bsnNumber
      );
      const isDateOfBirthMatch = Boolean(
        extractedData.dateOfBirth &&
          extractedData.dateOfBirth === userProfile.dateOfBirth
      );

      const verificationRecord = await prisma.userVerification.create({
        data: {
          userProfileId: userProfile.id,
          isLastNameMatch,
          isFirstNameMatch,
          isExpiryDateMatch,
          isBsnNumberMatch,
          isDateOfBirthMatch,
          extractedFirstName: extractedData.firstName,
          extractedLastName: extractedData.lastName,
          extractedBsnNumber: extractedData.extractedBsnNumber,
          extractedDateOfBirth: extractedData.dateOfBirth,
          extractedExpiryDate: extractedData.expiryDate,

          // Save existing user profile data
          ...existingData,
        },
      });

      return verificationRecord;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Error in processing driver license: ${error}`);
    }
  }
}
