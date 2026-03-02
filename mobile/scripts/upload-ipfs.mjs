import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Using a public demo gateway for Pinata just to get the job done (in a real app, use private keys)
const JWT = process.env.PINATA_JWT || '';

if (!JWT) {
    console.error('Need PINATA_JWT for upload');
    process.exit(1);
}

const uploadToIpfs = async () => {
  try {
    // 1. Upload Image
    const formData = new FormData();
    const imagePath = path.join(process.cwd(), 'assets', 'solcarbon-logo.png');
    formData.append('file', fs.createReadStream(imagePath));
    
    console.log('Uploading Logo to IPFS...');
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
      body: formData,
    });
    const resData = await res.json();
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${resData.IpfsHash}`;
    console.log('Logo URI:', imageUrl);

    // 2. Upload JSON
    const metadata = {
        name: "SolCarbon Credit",
        symbol: "SOLCC",
        description: "The official SolCarbon Carbon Credit Token on Solana.",
        image: imageUrl
    };

    const jsonFormData = new FormData();
    // Create a temporary file
    fs.writeFileSync('temp.json', JSON.stringify(metadata));
    jsonFormData.append('file', fs.createReadStream('temp.json'));

    console.log('Uploading Metadata JSON to IPFS...');
    const jsonRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
      body: jsonFormData,
    });
    const jsonResData = await jsonRes.json();
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${jsonResData.IpfsHash}`;
    console.log('\n✅ Metadata successfully uploaded!');
    console.log('FINAL URI:', metadataUrl);
    
    fs.unlinkSync('temp.json');

  } catch (error) {
    console.log(error);
  }
};

uploadToIpfs();
