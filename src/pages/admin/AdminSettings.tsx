import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Settings, Globe, Mail, CreditCard, Shield, Bell, Database, Plug, Eye, EyeOff, Plus, Trash2, Building2, CloudUpload, ExternalLink, Info, Users, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { setGoogleDriveClientId, getGoogleDriveClientId, isGoogleDriveConfigured } from "@/lib/google-drive";
import { clearSocialConfigCache } from "@/lib/social-auth";

// ── API Integrations Config ──
const apiIntegrations = [
  // ── Travel GDS & Suppliers ──
  { id: 'tti_astra', name: 'Air Astra TTI/ZENITH (Flight GDS)', description: 'Air Astra reservation system — real-time flight search, pricing & booking via TTI ZENITH API. Airline code: 2A', fields: [{ key: 'environment', label: 'Environment', placeholder: 'preproduction', type: 'select', options: ['preproduction', 'production'] }, { key: 'agency_id', label: 'Agency ID', placeholder: '10000240', type: 'text' }, { key: 'agency_name', label: 'Agency Name', placeholder: 'API for Evan International (10000240)', type: 'text' }, { key: 'preprod_url', label: 'Preproduction API URL', placeholder: 'http://tstws2.ttinteractive.com/Zenith/TTI.PublicApi.Services/JsonSaleEngineService.svc', type: 'text' }, { key: 'preprod_key', label: 'Preproduction API Key', placeholder: 'Preproduction API key', type: 'password' }, { key: 'prod_url', label: 'Production API URL', placeholder: 'https://emea.ttinteractive.com/Zenith/TTI.PublicApi.Services/JsonSaleEngineService.svc', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production API key', type: 'password' }], docs: 'https://emea.ttinteractive.com/Contenu/Documentation/PublicApi/Html/Default.html', category: 'travel' },
  { id: 'bdfare', name: 'BDFare (Flight GDS)', description: 'Bangladesh flight aggregator — Biman (BG), US-Bangla (BS), NovoAir (VQ) + international carriers', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'username', label: 'Username/Agent ID', placeholder: 'Your BDFare agent ID', type: 'text' }, { key: 'sandbox_url', label: 'Sandbox URL', placeholder: 'https://sandbox.bdfares.com/v1', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox API Key', placeholder: 'Sandbox key', type: 'password' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://api.bdfares.com/v1', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production key', type: 'password' }], docs: 'https://developer.bdfares.com', category: 'travel' },
  { id: 'flyhub', name: 'FlyHub (Flight GDS)', description: 'Alternative flight GDS — covers 450+ airlines worldwide with BD-optimized pricing', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'sandbox_url', label: 'Sandbox URL', placeholder: 'https://api.sandbox.flyhub.com/api/v1', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox API Key', placeholder: 'Sandbox key', type: 'password' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://api.flyhub.com/api/v1', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production key', type: 'password' }], docs: 'https://developer.flyhub.com', category: 'travel' },
  { id: 'sabre', name: 'Sabre GDS — JV_BD OTA (International Flights)', description: 'Sabre JV_BD OTA Solution — 400+ airlines via Bargain Finder Max API. OAuth v3 password grant with EPR credentials', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'cert', type: 'select', options: ['cert', 'production'] }, { key: 'pcc', label: 'PCC (Pseudo City Code)', placeholder: 'J4YL', type: 'text' }, { key: 'epr', label: 'EPR (Employee Profile Record)', placeholder: '631470', type: 'text' }, { key: 'agency_password', label: 'Agency Password', placeholder: 'Your agency password', type: 'password' }, { key: 'sandbox_client_id', label: 'CERT Client ID (JV_BD)', placeholder: '5B0K-JvBdOta', type: 'text' }, { key: 'sandbox_client_secret', label: 'CERT Client Secret (JV_BD)', placeholder: 'Pl67azTy', type: 'password' }, { key: 'sandbox_url', label: 'CERT REST API URL', placeholder: 'https://api.cert.platform.sabre.com', type: 'text' }, { key: 'prod_client_id', label: 'PROD Client ID (JV_BD)', placeholder: '5B0K-JvBdOta', type: 'text' }, { key: 'prod_client_secret', label: 'PROD Client Secret (JV_BD)', placeholder: 'M1uty91x', type: 'password' }, { key: 'prod_url', label: 'PROD REST API URL', placeholder: 'https://api.platform.sabre.com', type: 'text' }], docs: 'https://developer.sabre.com', category: 'travel' },
  { id: 'galileo', name: 'Galileo / Travelport (Global GDS)', description: 'Travelport Universal API — access Galileo, Apollo & Worldspan GDS. 400+ airlines, PNR management, ticketing & ancillaries', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'preproduction', type: 'select', options: ['preproduction', 'production'] }, { key: 'target_branch', label: 'Target Branch (PCC)', placeholder: 'P7206253', type: 'text' }, { key: 'username', label: 'Universal API Username', placeholder: 'Universal/uAPI...', type: 'text' }, { key: 'password', label: 'Universal API Password', placeholder: 'Your UAPI password', type: 'password' }, { key: 'provider', label: 'Provider Code', placeholder: '1G (Galileo) / 1V (Apollo) / 1P (Worldspan)', type: 'select', options: ['1G', '1V', '1P'] }, { key: 'preprod_url', label: 'Preproduction URL', placeholder: 'https://emea.universal-api.pp.travelport.com/B2BGateway/connect/uAPI', type: 'text' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://emea.universal-api.travelport.com/B2BGateway/connect/uAPI', type: 'text' }], docs: 'https://support.travelport.com/webhelp/uapi/', category: 'travel' },
  { id: 'ndc_gateway', name: 'NDC Gateway (IATA Standard)', description: 'IATA New Distribution Capability — direct airline content via NDC 21.3 standard. Supports IndiGo, Emirates, Lufthansa & more', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'aggregator', label: 'NDC Aggregator', placeholder: 'Verteil / Farelogix / Direct', type: 'select', options: ['verteil', 'farelogix', 'direct'] }, { key: 'sandbox_url', label: 'Sandbox URL', placeholder: 'https://sandbox.ndc-gateway.com/api/v1', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox API Key', placeholder: 'Sandbox key', type: 'password' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://api.ndc-gateway.com/api/v1', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production key', type: 'password' }, { key: 'airline_codes', label: 'Airline Codes (comma-separated)', placeholder: '6E,EK,LH,QR', type: 'text' }], docs: 'https://guides.developer.iata.org', category: 'travel' },
  { id: 'air_arabia', name: 'Air Arabia (Direct LCC)', description: 'Air Arabia direct API — low-cost carrier flights across Middle East, North Africa, Asia & Europe. IATA: G9', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'agent_id', label: 'Agent ID / Organization Code', placeholder: 'Your Air Arabia agent ID', type: 'text' }, { key: 'sandbox_url', label: 'Sandbox API URL', placeholder: 'https://api-sandbox.airarabia.com/v1', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox API Key', placeholder: 'Sandbox key', type: 'password' }, { key: 'prod_url', label: 'Production API URL', placeholder: 'https://api.airarabia.com/v1', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production key', type: 'password' }], docs: 'https://www.airarabia.com/en/business', category: 'travel' },
  { id: 'indigo_ndc', name: 'IndiGo Airlines (NDC Direct)', description: 'IndiGo 6E direct NDC API — India\'s largest airline, domestic & international flights. IATA: 6E', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'agent_id', label: 'Agent ID', placeholder: 'Your IndiGo agent ID', type: 'text' }, { key: 'sandbox_url', label: 'Sandbox URL', placeholder: 'https://developer.goindigo.in/api/ndc/v1', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox API Key', placeholder: 'Sandbox key', type: 'password' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://api.goindigo.in/ndc/v1', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production key', type: 'password' }], docs: 'https://developer.goindigo.in', category: 'travel' },
  { id: 'salam_air', name: 'Salam Air (Direct LCC)', description: 'Salam Air direct API — Oman\'s first LCC, routes across Middle East, South Asia & Europe. IATA: OV', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'agent_id', label: 'Agent ID', placeholder: 'Your Salam Air agent ID', type: 'text' }, { key: 'sandbox_url', label: 'Sandbox URL', placeholder: 'https://api-sandbox.salamair.com/v1', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox API Key', placeholder: 'Sandbox key', type: 'password' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://api.salamair.com/v1', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production key', type: 'password' }], docs: 'https://www.salamair.com/en/agents', category: 'travel' },
  { id: 'airasia', name: 'AirAsia (Direct LCC)', description: 'AirAsia direct API — Asia\'s largest LCC, 130+ destinations across ASEAN, India, Australia. IATA: AK/FD/QZ/Z2', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'agent_id', label: 'Agent ID / Partner Code', placeholder: 'Your AirAsia partner ID', type: 'text' }, { key: 'sandbox_url', label: 'Sandbox URL', placeholder: 'https://api-sandbox.airasia.com/v1', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox API Key', placeholder: 'Sandbox key', type: 'password' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://api.airasia.com/v1', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production key', type: 'password' }], docs: 'https://atlaslovestravel.com', category: 'travel' },
  { id: 'novoair', name: 'Novor Air / NovoAir (Direct LCC)', description: 'NovoAir direct API — Bangladesh domestic carrier, Dhaka-Chittagong-Cox\'s Bazar-Jessore-Sylhet. IATA: VQ', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'agent_id', label: 'Agent ID', placeholder: 'Your NovoAir agent ID', type: 'text' }, { key: 'sandbox_url', label: 'Sandbox URL', placeholder: 'https://api-sandbox.flynovoair.com/v1', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox API Key', placeholder: 'Sandbox key', type: 'password' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://api.flynovoair.com/v1', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production key', type: 'password' }], docs: 'https://www.flynovoair.com', category: 'travel' },
  { id: 'flyadeal', name: 'FlyAdeal (Direct LCC)', description: 'FlyAdeal direct API — Saudi Arabian LCC, domestic & regional routes. IATA: F3', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'agent_id', label: 'Agent ID', placeholder: 'Your FlyAdeal agent ID', type: 'text' }, { key: 'sandbox_url', label: 'Sandbox URL', placeholder: 'https://api-sandbox.flyadeal.com/v1', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox API Key', placeholder: 'Sandbox key', type: 'password' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://api.flyadeal.com/v1', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production key', type: 'password' }], docs: 'https://www.flyadeal.com', category: 'travel' },
  { id: 'flynas', name: 'Flynas (Direct LCC)', description: 'Flynas direct API — Saudi Arabian carrier, 70+ destinations across Middle East, Asia, Europe & Africa. IATA: XY', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'agent_id', label: 'Agent ID', placeholder: 'Your Flynas agent ID', type: 'text' }, { key: 'sandbox_url', label: 'Sandbox URL', placeholder: 'https://api-sandbox.flynas.com/v1', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox API Key', placeholder: 'Sandbox key', type: 'password' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://api.flynas.com/v1', type: 'text' }, { key: 'prod_key', label: 'Production API Key', placeholder: 'Production key', type: 'password' }], docs: 'https://www.flynas.com', category: 'travel' },
  { id: 'amadeus', name: 'Amadeus (Global GDS)', description: 'World\'s largest travel GDS — flights, hotels, cars across 400+ airlines and 150,000+ hotels', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'test', type: 'select', options: ['test', 'production'] }, { key: 'client_id', label: 'Client ID (API Key)', placeholder: 'Your Amadeus API key', type: 'text' }, { key: 'client_secret', label: 'Client Secret', placeholder: 'Your Amadeus secret', type: 'password' }], docs: 'https://developers.amadeus.com', category: 'travel' },
  { id: 'hotel_supplier', name: 'HotelBeds (Hotel Supplier)', description: 'Hotel inventory, rates & availability — 300,000+ hotels worldwide', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'api_url', label: 'API Base URL', placeholder: 'https://api.hotelbeds.com/hotel-api/1.0', type: 'text' }, { key: 'api_key', label: 'API Key', placeholder: 'Your API key', type: 'password' }, { key: 'api_secret', label: 'Shared Secret', placeholder: 'Your shared secret', type: 'password' }], docs: 'https://developer.hotelbeds.com', category: 'travel' },

  // ── Digital Services ──
  { id: 'airalo', name: 'Airalo (eSIM Provider)', description: 'Global eSIM marketplace — 200+ countries, instant QR code delivery', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'sandbox_url', label: 'Sandbox URL', placeholder: 'https://sandbox-partners-api.airalo.com/v2', type: 'text' }, { key: 'sandbox_key', label: 'Sandbox Token', placeholder: 'Sandbox token', type: 'password' }, { key: 'prod_url', label: 'Production URL', placeholder: 'https://partners-api.airalo.com/v2', type: 'text' }, { key: 'prod_key', label: 'Production Token', placeholder: 'Production token', type: 'password' }], docs: 'https://partners-doc.airalo.com', category: 'digital' },
  { id: 'ssl_recharge', name: 'SSL Wireless (Recharge Gateway)', description: 'BD mobile recharge — Grameenphone, Robi, Banglalink, Teletalk top-up processing', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'api_url', label: 'Gateway URL', placeholder: 'https://api.sslwireless.com/recharge', type: 'text' }, { key: 'username', label: 'Username', placeholder: 'Your SSL username', type: 'text' }, { key: 'password', label: 'Password', placeholder: 'Your SSL password', type: 'password' }], docs: 'https://sslwireless.com', category: 'digital' },
  { id: 'bill_payment', name: 'Bill Payment Gateway (PGWBD)', description: 'Utility bill payment — DESCO, DPDC, Titas Gas, WASA, internet, education', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'api_url', label: 'Gateway URL', placeholder: 'https://api.pgwbd.com/billpay', type: 'text' }, { key: 'merchant_id', label: 'Merchant ID', placeholder: 'Your merchant ID', type: 'text' }, { key: 'api_key', label: 'API Key', placeholder: 'Your API key', type: 'password' }], docs: '', category: 'digital' },

  // ── Payment Gateways ──
  { id: 'payment_bkash', name: 'bKash Payment Gateway', description: 'bKash merchant payment — BD\'s most popular mobile payment', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'app_key', label: 'App Key', placeholder: 'bKash App Key', type: 'password' }, { key: 'app_secret', label: 'App Secret', placeholder: 'bKash App Secret', type: 'password' }, { key: 'username', label: 'Username', placeholder: 'Merchant username', type: 'text' }, { key: 'password', label: 'Password', placeholder: 'Merchant password', type: 'password' }], docs: 'https://developer.bka.sh', category: 'payment' },
  { id: 'payment_nagad', name: 'Nagad Payment Gateway', description: 'Nagad merchant payment integration', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'merchant_id', label: 'Merchant ID', placeholder: 'Your Nagad merchant ID', type: 'text' }, { key: 'api_key', label: 'Public Key', placeholder: 'Nagad public key', type: 'password' }, { key: 'api_secret', label: 'Private Key', placeholder: 'Nagad private key', type: 'password' }], docs: 'https://nagad.com.bd/merchant', category: 'payment' },
  { id: 'payment_ssl', name: 'SSLCommerz (Card Payments)', description: 'Visa/Mastercard/AMEX — BD\'s leading payment gateway', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'environment', label: 'Environment', placeholder: 'sandbox', type: 'select', options: ['sandbox', 'production'] }, { key: 'store_id', label: 'Store ID', placeholder: 'Your store ID', type: 'text' }, { key: 'store_password', label: 'Store Password', placeholder: 'Your store password', type: 'password' }], docs: 'https://developer.sslcommerz.com', category: 'payment' },
  { id: 'payment_stripe', name: 'Stripe (International Cards)', description: 'International card payments — for foreign travelers booking through Seven Trip', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...', type: 'text' }, { key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...', type: 'password' }, { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'whsec_...', type: 'password' }], docs: 'https://docs.stripe.com', category: 'payment' },

  // ── Communication ──
  { id: 'sms_bulksmsbd', name: 'BulkSMSBD (SMS Gateway)', description: 'OTP, booking & transactional SMS delivery to BD numbers', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'api_key', label: 'API Key', placeholder: 'Your BulkSMSBD API key', type: 'password' }, { key: 'sender_id', label: 'Sender ID', placeholder: 'SevenTrip', type: 'text' }], docs: 'https://bulksmsbd.com/developer/sms-api', category: 'communication' },
  { id: 'email_resend', name: 'Resend (Email API)', description: 'Transactional emails — booking confirmations, OTP, invoices', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'api_key', label: 'API Key', placeholder: 're_xxxxxxxxxxxx', type: 'password' }, { key: 'from_email', label: 'From Address', placeholder: 'Seven Trip <noreply@seven-trip.com>', type: 'text' }], docs: 'https://resend.com/docs', category: 'communication' },
  { id: 'whatsapp_business', name: 'WhatsApp Business API', description: 'Send booking confirmations, updates & support via WhatsApp', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'phone_number_id', label: 'Phone Number ID', placeholder: 'Your WhatsApp phone number ID', type: 'text' }, { key: 'access_token', label: 'Access Token', placeholder: 'Your permanent access token', type: 'password' }, { key: 'verify_token', label: 'Webhook Verify Token', placeholder: 'Custom verify token', type: 'text' }], docs: 'https://developers.facebook.com/docs/whatsapp', category: 'communication' },

  // ── Maps & Location ──
  { id: 'google_maps', name: 'Google Maps Platform', description: 'Maps, places autocomplete, directions & geocoding for hotels/medical/cars', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'api_key', label: 'API Key', placeholder: 'AIzaSy...', type: 'password' }], docs: 'https://developers.google.com/maps', category: 'utility' },
  { id: 'google_vision', name: 'Google Cloud Vision (Passport OCR)', description: 'Passport & NID scanning — extracts name, DOB, passport number, expiry from uploaded images using Google Cloud Vision AI', fields: [{ key: 'enabled', label: 'Enabled', placeholder: '', type: 'select', options: ['true', 'false'] }, { key: 'apiKey', label: 'API Key', placeholder: 'AIzaSy...', type: 'password' }], docs: 'https://cloud.google.com/vision/docs', category: 'utility' },
];

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  routingNumber: string;
  enabled: boolean;
}

const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [];

const DEFAULT_PAYMENT_METHODS = [
  { id: "bank_deposit", name: "Bank Deposit", description: "User deposits cash at your bank branch", enabled: true },
  { id: "bank_transfer", name: "Bank Transfer / Wire Transfer", description: "User transfers from their bank to yours", enabled: true },
  { id: "cheque_deposit", name: "Cheque Deposit", description: "User deposits a cheque at your bank", enabled: true },
  { id: "mobile_bkash", name: "bKash", description: "bKash mobile payment", enabled: true },
  { id: "mobile_nagad", name: "Nagad", description: "Nagad mobile payment", enabled: true },
  { id: "mobile_rocket", name: "Rocket", description: "Rocket mobile payment", enabled: false },
  { id: "card", name: "Visa / Mastercard (SSLCommerz)", description: "Credit/Debit card via payment gateway", enabled: true },
];

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [apiKeyValues, setApiKeyValues] = useState<Record<string, Record<string, string>>>({});
  const [socialOAuth, setSocialOAuth] = useState<Record<string, Record<string, string>>>({});
  const [socialVisible, setSocialVisible] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<Record<string, boolean>>({ newBooking: true, paymentReceived: true, refundRequest: true, lowInventory: true });
  const [enabledApis, setEnabledApis] = useState<Record<string, boolean>>({
    tti_astra: true, flight_gds: true, hotel_supplier: false, esim_provider: true, recharge_gateway: true,
    bill_payment: true, payment_bkash: true, payment_nagad: true, payment_ssl: true, sms_bulksmsbd: true, email_resend: true,
  });
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(DEFAULT_BANK_ACCOUNTS);
  const [newBank, setNewBank] = useState<Partial<BankAccount>>({});
  const [showAddBank, setShowAddBank] = useState(false);
  const [generalForm, setGeneralForm] = useState({ siteName: 'Seven Trip', supportEmail: 'support@seven-trip.com', currency: 'bdt', language: 'en' });

  // Load all settings from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<any>('/admin/settings');
        if (data.apiKeys) setApiKeyValues(data.apiKeys);
        if (data.socialOAuth) setSocialOAuth(data.socialOAuth);
        if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
        if (data.bankAccounts) setBankAccounts(data.bankAccounts);
        if (data.notificationPrefs) setNotifications(data.notificationPrefs);
        if (data.siteName) setGeneralForm(prev => ({ ...prev, siteName: data.siteName }));
        if (data.supportEmail) setGeneralForm(prev => ({ ...prev, supportEmail: data.supportEmail }));
        if (data.defaultCurrency) setGeneralForm(prev => ({ ...prev, currency: data.defaultCurrency }));

        // Mark APIs as enabled if they have keys
        if (data.apiKeys) {
          const enabled: Record<string, boolean> = { ...enabledApis };
          for (const [id, keys] of Object.entries(data.apiKeys)) {
            if (keys && Object.values(keys as Record<string, string>).some(v => v)) enabled[id] = true;
          }
          setEnabledApis(enabled);
        }
      } catch {
        // Graceful fallback — use defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateApiKey = (apiId: string, fieldKey: string, value: string) => {
    setApiKeyValues(prev => ({ ...prev, [apiId]: { ...(prev[apiId] || {}), [fieldKey]: value } }));
  };

  const toggleNotification = async (key: string) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    try { await api.put('/admin/settings', { section: 'notifications', notifications: next }); } catch {}
  };

  const handleSaveApiConnection = async (apiItem: typeof apiIntegrations[0]) => {
    const keys = apiKeyValues[apiItem.id] || {};
    const hasValues = apiItem.fields.some(f => keys[f.key]);
    if (!hasValues) { toast.error("Please enter at least one field value."); return; }
    try {
      await api.put('/admin/settings', { section: 'api_integration', integration: apiItem.id, keys });
      toast.success(`${apiItem.name} connection saved securely to database!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save. Check your connection.");
    }
  };

  const togglePaymentMethod = (id: string) => setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));

  const addBankAccount = () => {
    if (!newBank.bankName || !newBank.accountNumber) return;
    const updated = [...bankAccounts, {
      id: Date.now().toString(), bankName: newBank.bankName || '', accountName: newBank.accountName || '',
      accountNumber: newBank.accountNumber || '', branch: newBank.branch || '', routingNumber: newBank.routingNumber || '', enabled: true,
    }];
    setBankAccounts(updated);
    setNewBank({});
    setShowAddBank(false);
    // Auto-save to backend
    api.put('/admin/settings', { section: 'bank_accounts', bankAccounts: updated }).catch(() => {});
    toast.success("Bank account added!");
  };

  const removeBankAccount = (id: string) => {
    const updated = bankAccounts.filter(b => b.id !== id);
    setBankAccounts(updated);
    api.put('/admin/settings', { section: 'bank_accounts', bankAccounts: updated }).catch(() => {});
    toast.success("Bank account removed.");
  };

  const toggleBankAccount = (id: string) => {
    const updated = bankAccounts.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b);
    setBankAccounts(updated);
    api.put('/admin/settings', { section: 'bank_accounts', bankAccounts: updated }).catch(() => {});
  };

  const toggleFieldVisibility = (fieldKey: string) => setVisibleFields(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  const toggleApiEnabled = (apiId: string) => setEnabledApis(prev => ({ ...prev, [apiId]: !prev[apiId] }));

  const handleSaveGeneral = async () => {
    try {
      await api.put('/admin/settings', { section: 'general', siteName: generalForm.siteName, supportEmail: generalForm.supportEmail, defaultCurrency: generalForm.currency });
      toast.success("General settings saved!");
    } catch { toast.error("Failed to save general settings."); }
  };
  const handleSavePayments = async () => {
    try {
      await api.put('/admin/settings', { section: 'payments', paymentMethods });
      toast.success("Payment settings saved to database!");
    } catch { toast.error("Failed to save payment settings."); }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-xl sm:text-2xl font-bold">System Settings</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading settings from database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">System Settings</h1>
        <Badge variant="outline" className="text-[10px]"><Database className="w-3 h-3 mr-1" /> All settings stored in database</Badge>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Settings className="w-5 h-5 text-primary" /></div>
            <div><CardTitle className="text-lg">General Settings</CardTitle><CardDescription>Configure basic platform settings</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Site Name</Label><Input value={generalForm.siteName} onChange={e => setGeneralForm(p => ({ ...p, siteName: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Support Email</Label><Input value={generalForm.supportEmail} onChange={e => setGeneralForm(p => ({ ...p, supportEmail: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Default Currency</Label>
              <Select value={generalForm.currency} onValueChange={v => setGeneralForm(p => ({ ...p, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bdt">BDT (৳)</SelectItem><SelectItem value="usd">USD ($)</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Default Language</Label>
              <Select value={generalForm.language} onValueChange={v => setGeneralForm(p => ({ ...p, language: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="bn">বাংলা</SelectItem></SelectContent></Select>
            </div>
          </div>
          <Button onClick={handleSaveGeneral}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-primary" /></div>
            <div><CardTitle className="text-lg">Payment Methods</CardTitle><CardDescription>Enable or disable payment methods available to users.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.map(m => (
            <div key={m.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                  {m.id.includes('bank') || m.id.includes('cheque') ? <Building2 className={`w-4 h-4 ${m.enabled ? 'text-primary' : 'text-muted-foreground'}`} /> : <CreditCard className={`w-4 h-4 ${m.enabled ? 'text-primary' : 'text-muted-foreground'}`} />}
                </div>
                <div>
                  <div className="flex items-center gap-2"><p className="text-sm font-semibold">{m.name}</p><Badge variant={m.enabled ? "default" : "secondary"} className="text-[10px] h-5">{m.enabled ? "Enabled" : "Disabled"}</Badge></div>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
              </div>
              <Switch checked={m.enabled} onCheckedChange={() => togglePaymentMethod(m.id)} />
            </div>
          ))}
          <Button className="mt-2" onClick={handleSavePayments}>Save Payment Settings</Button>
        </CardContent>
      </Card>

      {/* Bank Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
              <div><CardTitle className="text-lg">Company Bank Accounts</CardTitle><CardDescription>Bank accounts shown to users for deposit & wire transfer payments.</CardDescription></div>
            </div>
            <Dialog open={showAddBank} onOpenChange={setShowAddBank}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Bank</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5"><Label>Bank Name *</Label><Input value={newBank.bankName || ''} onChange={e => setNewBank(p => ({ ...p, bankName: e.target.value }))} placeholder="e.g. Dutch-Bangla Bank Limited" /></div>
                  <div className="space-y-1.5"><Label>Account Name *</Label><Input value={newBank.accountName || ''} onChange={e => setNewBank(p => ({ ...p, accountName: e.target.value }))} placeholder="e.g. Seven Trip Ltd" /></div>
                  <div className="space-y-1.5"><Label>Account Number *</Label><Input value={newBank.accountNumber || ''} onChange={e => setNewBank(p => ({ ...p, accountNumber: e.target.value }))} placeholder="Enter account number" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Branch</Label><Input value={newBank.branch || ''} onChange={e => setNewBank(p => ({ ...p, branch: e.target.value }))} placeholder="Branch name" /></div>
                    <div className="space-y-1.5"><Label>Routing Number</Label><Input value={newBank.routingNumber || ''} onChange={e => setNewBank(p => ({ ...p, routingNumber: e.target.value }))} placeholder="Routing #" /></div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={addBankAccount} disabled={!newBank.bankName || !newBank.accountNumber}>Add Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0 table-responsive">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank Name</TableHead><TableHead className="hidden sm:table-cell">Account Name</TableHead>
                <TableHead>Account Number</TableHead><TableHead className="hidden md:table-cell">Branch</TableHead>
                <TableHead className="hidden md:table-cell">Routing</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankAccounts.map(acc => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium text-sm">{acc.bankName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{acc.accountName}</TableCell>
                  <TableCell className="font-mono text-xs font-bold">{acc.accountNumber}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{acc.branch}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{acc.routingNumber}</TableCell>
                  <TableCell><Switch checked={acc.enabled} onCheckedChange={() => toggleBankAccount(acc.id)} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeBankAccount(acc.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {bankAccounts.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No bank accounts configured</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email & SMS */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Mail className="w-5 h-5 text-primary" /></div>
            <div><CardTitle className="text-lg">Email & SMS Configuration</CardTitle><CardDescription>Transactional email via Resend, SMS via BulkSMSBD</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-1.5"><Info className="w-4 h-4 text-blue-600" /> Where to configure:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Email:</strong> Scroll to API Integrations → Communication → Resend (Email API)</li>
              <li><strong>SMS:</strong> Scroll to API Integrations → Communication → BulkSMSBD</li>
            </ul>
            <p className="text-[11px] text-muted-foreground mt-1">All API keys are stored encrypted in the database — never in browser storage or code.</p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Bell className="w-5 h-5 text-primary" /></div>
            <div><CardTitle className="text-lg">Notification Settings</CardTitle><CardDescription>Configure system notifications</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "newBooking", label: "New Booking Alert", desc: "Get notified for every new booking" },
            { key: "paymentReceived", label: "Payment Received", desc: "Alert when payment is received" },
            { key: "refundRequest", label: "Refund Request", desc: "Notify on refund requests" },
            { key: "lowInventory", label: "Low Inventory", desc: "Alert when availability is low" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
              <Switch checked={notifications[n.key] !== false} onCheckedChange={() => toggleNotification(n.key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* API Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Plug className="w-5 h-5 text-primary" /></div>
            <div>
              <CardTitle className="text-lg">API Integrations</CardTitle>
              <CardDescription>Configure 3rd-party API keys. All keys are stored securely in the database — not in browser storage or .env files.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="travel" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="travel">Travel APIs</TabsTrigger>
              <TabsTrigger value="digital">Digital Services</TabsTrigger>
              <TabsTrigger value="payment">Payment Gateways</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="utility">Utility & AI</TabsTrigger>
            </TabsList>
            {['travel', 'digital', 'payment', 'communication', 'utility'].map(cat => (
              <TabsContent key={cat} value={cat} className="space-y-4">
                {apiIntegrations.filter(a => a.category === cat).map(apiItem => (
                  <div key={apiItem.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{apiItem.name}</p>
                          <Badge variant={enabledApis[apiItem.id] ? "default" : "secondary"} className="text-[10px] h-5">{enabledApis[apiItem.id] ? "Active" : "Inactive"}</Badge>
                          {apiKeyValues[apiItem.id] && Object.values(apiKeyValues[apiItem.id]).some(v => v) && (
                            <Badge variant="outline" className="text-[10px] h-5 text-success border-success/30"><Shield className="w-2.5 h-2.5 mr-0.5" /> Keys Saved</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{apiItem.description}</p>
                      </div>
                      <Switch checked={enabledApis[apiItem.id]} onCheckedChange={() => toggleApiEnabled(apiItem.id)} />
                    </div>
                    {enabledApis[apiItem.id] && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {apiItem.fields.map(field => (
                            <div key={field.key} className="space-y-1">
                              <Label className="text-xs">{field.label}</Label>
                              {field.type === 'select' && 'options' in field ? (
                                <Select value={apiKeyValues[apiItem.id]?.[field.key] || field.options?.[0] || ''} onValueChange={v => updateApiKey(apiItem.id, field.key, v)}>
                                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {(field as any).options?.map((opt: string) => (
                                      <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                              <div className="relative">
                                <Input type={field.type === 'password' && !visibleFields[`${apiItem.id}_${field.key}`] ? 'password' : 'text'} placeholder={field.placeholder} className="pr-10 text-sm h-9" value={apiKeyValues[apiItem.id]?.[field.key] || ''} onChange={e => updateApiKey(apiItem.id, field.key, e.target.value)} />
                                {field.type === 'password' && (
                                  <button type="button" onClick={() => toggleFieldVisibility(`${apiItem.id}_${field.key}`)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {visibleFields[`${apiItem.id}_${field.key}`] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" className="h-8 text-xs" onClick={() => handleSaveApiConnection(apiItem)}>
                            <Database className="w-3 h-3 mr-1" /> Save to Database
                          </Button>
                          {apiItem.docs && <Button size="sm" variant="ghost" className="h-8 text-xs" asChild><a href={apiItem.docs} target="_blank" rel="noopener noreferrer">View Docs ↗</a></Button>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Social Login */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
            <div>
              <CardTitle className="text-lg">Social Login (OAuth)</CardTitle>
              <CardDescription>Enable Google & Facebook sign-in. Credentials stored in database.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google OAuth */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <div className="flex-1">
                <p className="text-sm font-semibold">Google Sign-In</p>
                <p className="text-xs text-muted-foreground">Allow users to sign in with Google</p>
              </div>
              <Badge variant={socialOAuth.google?.clientId ? "default" : "secondary"} className="text-[10px] h-5">
                {socialOAuth.google?.clientId ? "Configured" : "Not Set"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Client ID</Label>
                <Input placeholder="123456789-abc.apps.googleusercontent.com" className="text-sm h-9 font-mono" value={socialOAuth.google?.clientId || ''} onChange={e => {
                  setSocialOAuth(prev => ({ ...prev, google: { ...(prev.google || {}), clientId: e.target.value } }));
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Client Secret</Label>
                <div className="relative">
                  <Input type={socialVisible.googleSecret ? 'text' : 'password'} placeholder="GOCSPX-..." className="text-sm h-9 font-mono pr-9" value={socialOAuth.google?.clientSecret || ''} onChange={e => {
                    setSocialOAuth(prev => ({ ...prev, google: { ...(prev.google || {}), clientSecret: e.target.value } }));
                  }} />
                  <button type="button" onClick={() => setSocialVisible(p => ({ ...p, googleSecret: !p.googleSecret }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {socialVisible.googleSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Facebook OAuth */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <div className="flex-1">
                <p className="text-sm font-semibold">Facebook Login</p>
                <p className="text-xs text-muted-foreground">Allow users to sign in with Facebook</p>
              </div>
              <Badge variant={socialOAuth.facebook?.appId ? "default" : "secondary"} className="text-[10px] h-5">
                {socialOAuth.facebook?.appId ? "Configured" : "Not Set"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">App ID</Label>
                <Input placeholder="123456789012345" className="text-sm h-9 font-mono" value={socialOAuth.facebook?.appId || ''} onChange={e => {
                  setSocialOAuth(prev => ({ ...prev, facebook: { ...(prev.facebook || {}), appId: e.target.value } }));
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">App Secret</Label>
                <div className="relative">
                  <Input type={socialVisible.fbSecret ? 'text' : 'password'} placeholder="abc123def456..." className="text-sm h-9 font-mono pr-9" value={socialOAuth.facebook?.appSecret || ''} onChange={e => {
                    setSocialOAuth(prev => ({ ...prev, facebook: { ...(prev.facebook || {}), appSecret: e.target.value } }));
                  }} />
                  <button type="button" onClick={() => setSocialVisible(p => ({ ...p, fbSecret: !p.fbSecret }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {socialVisible.fbSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={async () => {
            try {
              if (socialOAuth.google?.clientId) {
                await api.put('/admin/settings', { section: 'social_oauth', provider: 'google', config: socialOAuth.google });
              }
              if (socialOAuth.facebook?.appId) {
                await api.put('/admin/settings', { section: 'social_oauth', provider: 'facebook', config: socialOAuth.facebook });
              }
              clearSocialConfigCache();
              toast.success("Social login settings saved to database!");
            } catch {
              toast.error("Failed to save social login settings.");
            }
          }}>
            <Database className="w-4 h-4 mr-1" /> Save Social Login Settings
          </Button>
        </CardContent>
      </Card>

      {/* Google Drive */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><CloudUpload className="w-5 h-5 text-blue-600" /></div>
            <div>
              <CardTitle className="text-lg">Google Drive Integration</CardTitle>
              <CardDescription>Enable one-click document upload to Google Drive from Visa Management</CardDescription>
            </div>
            <Badge variant={isGoogleDriveConfigured() ? "default" : "secondary"} className="ml-auto text-[10px] h-5">{isGoogleDriveConfigured() ? "Connected" : "Not Configured"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>OAuth 2.0 Client ID</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 123456789-abc123.apps.googleusercontent.com"
                defaultValue={getGoogleDriveClientId()}
                className="font-mono text-sm"
                id="gdrive-client-id"
              />
              <Button onClick={() => {
                const input = document.getElementById('gdrive-client-id') as HTMLInputElement;
                const val = input?.value?.trim();
                if (!val) { toast.error("Please enter a Client ID"); return; }
                setGoogleDriveClientId(val);
                toast.success("Google Drive Client ID saved!");
              }}>Save</Button>
            </div>
            <p className="text-[10px] text-muted-foreground">This is a public/publishable key — safe to store in browser.</p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><Database className="w-5 h-5 text-destructive" /></div>
            <div><CardTitle className="text-lg text-destructive">Danger Zone</CardTitle><CardDescription>Irreversible actions</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div><p className="text-sm font-medium">Clear Cache</p><p className="text-xs text-muted-foreground">Clear all system cache and regenerate</p></div>
            <Button variant="destructive" size="sm" onClick={() => { localStorage.removeItem('seventrip_homepage_cms'); toast.success("Cache cleared!"); }}>Clear Cache</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
