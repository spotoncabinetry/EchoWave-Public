# EchoWave 🌊

An AI-powered restaurant management platform tailored for the Australian hospitality industry. EchoWave acts as a virtual receptionist, automating customer interactions, order management, and targeted SMS marketing campaigns.

## 🚀 Features

- **AI Virtual Receptionist**: Automated customer interactions using OpenAI's Realtime API
- **Menu Management**: Easy-to-use interface for managing restaurant menus
- **SMS Marketing**: Targeted campaigns using Twilio (Australian numbers)
- **Customer Profiles**: Automated profile creation and management
- **Australian Compliance**: Data hosted in Australian data centers via Supabase
- **Payment Processing**: Integrated payment system in AUD

## 🛠️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Supabase (Australian Data Centers)
- **AI Integration**: OpenAI API
- **Communications**: Twilio API
- **Authentication**: Supabase Auth

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/spotoncabinetry/EchoWave.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   OPENAI_API_KEY=your_openai_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security

- All sensitive data is stored in Australian data centers
- Compliant with Australian privacy regulations
- Secure API key management
- Protected database access

## 📝 License

Private repository - All rights reserved
