import InputTextBase from './e-input-text-base.js';
import { html } from 'lit';
import { MaskInput } from "maska";
import * as z from "zod";

const COUNTRIES = [
  { code: 'AF', dial: '+93', name: 'Afghanistan',               mask: '### ### ###',                maxDigits: 9 },
  { code: 'AX', dial: '+358', name: 'Åland Islands',            mask: '### ### ## ###',            maxDigits: 10 },
  { code: 'AL', dial: '+355', name: 'Albania',                  mask: '### ### ###',                maxDigits: 9 },
  { code: 'DZ', dial: '+213', name: 'Algeria',                  mask: '### ## ## ##',               maxDigits: 9 },
  { code: 'AS', dial: '+1',   name: 'American Samoa',           mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'AD', dial: '+376', name: 'Andorra',                  mask: '### ###',                    maxDigits: 6 },
  { code: 'AO', dial: '+244', name: 'Angola',                   mask: '### ### ###',                maxDigits: 9 },
  { code: 'AI', dial: '+1',   name: 'Anguilla',                 mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'AG', dial: '+1',   name: 'Antigua and Barbuda',      mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'AR', dial: '+54',  name: 'Argentina',                mask: '### ###-####',               maxDigits: 10 },
  { code: 'AM', dial: '+374', name: 'Armenia',                  mask: '## ### ###',                 maxDigits: 8 },
  { code: 'AW', dial: '+297', name: 'Aruba',                    mask: '### ####',                   maxDigits: 7 },
  { code: 'AU', dial: '+61',  name: 'Australia',                mask: '#### ## ####',               maxDigits: 9 },
  { code: 'AT', dial: '+43',  name: 'Austria',                  mask: '### ### ###',                maxDigits: 10 },
  { code: 'AZ', dial: '+994', name: 'Azerbaijan',               mask: '## ### ## ##',               maxDigits: 9 },
  { code: 'BS', dial: '+1',   name: 'Bahamas',                  mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'BH', dial: '+973', name: 'Bahrain',                  mask: '### ## ###',                 maxDigits: 8 },
  { code: 'BD', dial: '+880', name: 'Bangladesh',               mask: '## ### ###',                 maxDigits: 8 },
  { code: 'BB', dial: '+1',   name: 'Barbados',                 mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'BY', dial: '+375', name: 'Belarus',                  mask: '## ### ## ##',               maxDigits: 9 },
  { code: 'BE', dial: '+32',  name: 'Belgium',                  mask: '### ## ## ##',               maxDigits: 9 },
  { code: 'BZ', dial: '+501', name: 'Belize',                   mask: '### ###',                    maxDigits: 7 },
  { code: 'BJ', dial: '+229', name: 'Benin',                    mask: '## ## ## ##',                maxDigits: 8 },
  { code: 'BM', dial: '+1',   name: 'Bermuda',                  mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'BT', dial: '+975', name: 'Bhutan',                   mask: '# ### ###',                  maxDigits: 7 },
  { code: 'BO', dial: '+591', name: 'Bolivia',                  mask: '### ### ###',                maxDigits: 8 },
  { code: 'BA', dial: '+387', name: 'Bosnia and Herzegovina',   mask: '### ### ###',                maxDigits: 9 },
  { code: 'BW', dial: '+267', name: 'Botswana',                 mask: '## ### ###',                 maxDigits: 8 },
  { code: 'BR', dial: '+55',  name: 'Brazil',                   mask: '(##) #####-####',            maxDigits: 11 },
  { code: 'IO', dial: '+246', name: 'British Indian Ocean Terr', mask: '### #####',                 maxDigits: 7 },
  { code: 'VG', dial: '+1',   name: 'British Virgin Islands',   mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'BN', dial: '+673', name: 'Brunei',                   mask: '### ####',                   maxDigits: 7 },
  { code: 'BG', dial: '+359', name: 'Bulgaria',                 mask: '### ### ###',                maxDigits: 9 },
  { code: 'BF', dial: '+226', name: 'Burkina Faso',             mask: '## ## ## ##',                maxDigits: 8 },
  { code: 'BI', dial: '+257', name: 'Burundi',                  mask: '## ## ## ##',                maxDigits: 8 },
  { code: 'KH', dial: '+855', name: 'Cambodia',                 mask: '# ### ### ###',              maxDigits: 9 },
  { code: 'CM', dial: '+237', name: 'Cameroon',                 mask: '### ### ## ##',              maxDigits: 9 },
  { code: 'CA', dial: '+1',   name: 'Canada',                   mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'CV', dial: '+238', name: 'Cape Verde',               mask: '### ## ##',                  maxDigits: 7 },
  { code: 'KY', dial: '+1',   name: 'Cayman Islands',           mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'CF', dial: '+236', name: 'Central African Republic', mask: '## ## ## ##',                maxDigits: 8 },
  { code: 'TD', dial: '+235', name: 'Chad',                     mask: '## ## ## ##',                maxDigits: 8 },
  { code: 'CL', dial: '+56',  name: 'Chile',                    mask: '# #### ####',                maxDigits: 9 },
  { code: 'CN', dial: '+86',  name: 'China',                    mask: '### #### ####',              maxDigits: 11 },
  { code: 'CX', dial: '+61',  name: 'Christmas Island',         mask: '#### ## ####',               maxDigits: 9 },
  { code: 'CC', dial: '+61',  name: 'Cocos Islands',            mask: '#### ## ####',               maxDigits: 9 },
  { code: 'CO', dial: '+57',  name: 'Colombia',                 mask: '### #### ###',               maxDigits: 10 },
  { code: 'KM', dial: '+269', name: 'Comoros',                  mask: '### ## ##',                  maxDigits: 7 },
  { code: 'CK', dial: '+682', name: 'Cook Islands',             mask: '### ## ##',                  maxDigits: 7 },
  { code: 'CR', dial: '+506', name: 'Costa Rica',               mask: '#### ####',                  maxDigits: 8 },
  { code: 'HR', dial: '+385', name: 'Croatia',                  mask: '### ### ###',                maxDigits: 9 },
  { code: 'CU', dial: '+53',  name: 'Cuba',                     mask: '# ### ####',                 maxDigits: 8 },
  { code: 'CW', dial: '+599', name: 'Curaçao',                  mask: '### ### ####',               maxDigits: 10 },
  { code: 'CY', dial: '+357', name: 'Cyprus',                   mask: '## ### ###',                 maxDigits: 8 },
  { code: 'CZ', dial: '+420', name: 'Czech Republic',           mask: '### ### ###',                maxDigits: 9 },
  { code: 'CD', dial: '+243', name: 'Democratic Republic of t', mask: '### ### ###',                maxDigits: 9 },
  { code: 'DK', dial: '+45',  name: 'Denmark',                  mask: '## ## ## ##',                maxDigits: 8 },
  { code: 'DJ', dial: '+253', name: 'Djibouti',                 mask: '## ## ## ##',                maxDigits: 8 },
  { code: 'DM', dial: '+1',   name: 'Dominica',                 mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'DO', dial: '+1',   name: 'Dominican Republic',       mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'EC', dial: '+593', name: 'Ecuador',                  mask: '# ### ### ###',              maxDigits: 10 },
  { code: 'EG', dial: '+20',  name: 'Egypt',                    mask: '### ### ####',               maxDigits: 10 },
  { code: 'SV', dial: '+503', name: 'El Salvador',              mask: '### ####',                   maxDigits: 8 },
  { code: 'GQ', dial: '+240', name: 'Equatorial Guinea',        mask: '### ### ###',                maxDigits: 9 },
  { code: 'ER', dial: '+291', name: 'Eritrea',                  mask: '# ### ###',                  maxDigits: 7 },
  { code: 'EE', dial: '+372', name: 'Estonia',                  mask: '### #### ##',                maxDigits: 8 },
  { code: 'SZ', dial: '+268', name: 'Eswatini',                 mask: '## ## ## ##',                maxDigits: 8 },
  { code: 'ET', dial: '+251', name: 'Ethiopia',                 mask: '### ### ####',               maxDigits: 10 },
  { code: 'FK', dial: '+500', name: 'Falkland Islands',         mask: '#####',                      maxDigits: 5 },
  { code: 'FO', dial: '+298', name: 'Faroe Islands',            mask: '### ###',                    maxDigits: 6 },
  { code: 'FJ', dial: '+679', name: 'Fiji',                     mask: '### ####',                   maxDigits: 7 },
  { code: 'FI', dial: '+358', name: 'Finland',                  mask: '### ### ## ##',              maxDigits: 10 },
  { code: 'FR', dial: '+33',  name: 'France',                   mask: '# ## ## ## ##',              maxDigits: 9 },
  { code: 'GF', dial: '+594', name: 'French Guiana',            mask: '### ## ## ##',               maxDigits: 9 },
  { code: 'PF', dial: '+689', name: 'French Polynesia',         mask: '## ## ## ##',                maxDigits: 8 },
  { code: 'GA', dial: '+241', name: 'Gabon',                    mask: '# ## ## ##',                 maxDigits: 7 },
  { code: 'GM', dial: '+220', name: 'Gambia',                   mask: '### ####',                   maxDigits: 7 },
  { code: 'GE', dial: '+995', name: 'Georgia',                  mask: '### ### ###',                maxDigits: 9 },
  { code: 'DE', dial: '+49',  name: 'Germany',                  mask: '### ### ####',               maxDigits: 11 },
  { code: 'GH', dial: '+233', name: 'Ghana',                    mask: '### ### ####',               maxDigits: 9 },
  { code: 'GI', dial: '+350', name: 'Gibraltar',                mask: '### #######',                maxDigits: 8 },
  { code: 'GR', dial: '+30',  name: 'Greece',                   mask: '### ### ####',               maxDigits: 10 },
  { code: 'GL', dial: '+299', name: 'Greenland',                mask: '## ## ##',                   maxDigits: 6 },
  { code: 'GD', dial: '+1',   name: 'Grenada',                  mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'GP', dial: '+590', name: 'Guadeloupe',               mask: '### ## ## ##',               maxDigits: 9 },
  { code: 'GU', dial: '+1',   name: 'Guam',                     mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'GT', dial: '+502', name: 'Guatemala',                mask: '### ## ## ##',               maxDigits: 8 },
  { code: 'GG', dial: '+44',  name: 'Guernsey',                 mask: '### ### ####',               maxDigits: 10 },
  { code: 'GN', dial: '+224', name: 'Guinea',                   mask: '### ## ## ##',               maxDigits: 9 },
  { code: 'GW', dial: '+245', name: 'Guinea-Bissau',            mask: '# ### ###',                  maxDigits: 7 },
  { code: 'GY', dial: '+592', name: 'Guyana',                   mask: '### ####',                   maxDigits: 7 },
  { code: 'HT', dial: '+509', name: 'Haiti',                    mask: '### ## ## ##',               maxDigits: 8 },
  { code: 'HN', dial: '+504', name: 'Honduras',                 mask: '#### ####',                  maxDigits: 8 },
  { code: 'HK', dial: '+852', name: 'Hong Kong',                mask: '#### ####',                  maxDigits: 8 },
  { code: 'HU', dial: '+36',  name: 'Hungary',                  mask: '## ### ####',                maxDigits: 9 },
  { code: 'IS', dial: '+354', name: 'Iceland',                  mask: '### ####',                   maxDigits: 7 },
  { code: 'IN', dial: '+91',  name: 'India',                    mask: '#### #####',                 maxDigits: 10 },
  { code: 'ID', dial: '+62',  name: 'Indonesia',                mask: '###-####-####',              maxDigits: 11 },
  { code: 'IR', dial: '+98',  name: 'Iran',                     mask: '### ### ####',               maxDigits: 10 },
  { code: 'IQ', dial: '+964', name: 'Iraq',                     mask: '### ### ####',               maxDigits: 10 },
  { code: 'IE', dial: '+353', name: 'Ireland',                  mask: '### ### ###',                maxDigits: 9 },
  { code: 'IM', dial: '+44',  name: 'Isle of Man',              mask: '### ### ####',               maxDigits: 10 },
  { code: 'IL', dial: '+972', name: 'Israel',                   mask: '##-###-####',                maxDigits: 9 },
  { code: 'IT', dial: '+39',  name: 'Italy',                    mask: '### ######',                 maxDigits: 10 },
  { code: 'CI', dial: '+225', name: 'Ivory Coast',              mask: '#### ## ##',                 maxDigits: 8 },
  { code: 'JM', dial: '+1',   name: 'Jamaica',                  mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'JP', dial: '+81',  name: 'Japan',                    mask: '0###-####',                  maxDigits: 8 },
  { code: 'JE', dial: '+44',  name: 'Jersey',                   mask: '### ### ####',               maxDigits: 10 },
  { code: 'JO', dial: '+962', name: 'Jordan',                   mask: '## ### ####',                maxDigits: 9 },
  { code: 'KZ', dial: '+7',   name: 'Kazakhstan',               mask: '### ###-##-##',              maxDigits: 10 },
  { code: 'KE', dial: '+254', name: 'Kenya',                    mask: '### ######',                 maxDigits: 9 },
  { code: 'KI', dial: '+686', name: 'Kiribati',                 mask: '#### ####',                  maxDigits: 8 },
  { code: 'KP', dial: '+850', name: 'North Korea',              mask: '### ###',                    maxDigits: 6 },
  { code: 'KR', dial: '+82',  name: 'South Korea',              mask: '010-####-####',              maxDigits: 11 },
  { code: 'KW', dial: '+965', name: 'Kuwait',                   mask: '### ### ##',                 maxDigits: 8 },
  { code: 'KG', dial: '+996', name: 'Kyrgyzstan',               mask: '### ### ###',                maxDigits: 9 },
  { code: 'LA', dial: '+856', name: 'Laos',                     mask: '# ### ### ###',              maxDigits: 10 },
  { code: 'LV', dial: '+371', name: 'Latvia',                   mask: '## ### ###',                 maxDigits: 8 },
  { code: 'LB', dial: '+961', name: 'Lebanon',                  mask: '### ### ###',                maxDigits: 8 },
  { code: 'LS', dial: '+266', name: 'Lesotho',                  mask: '### ## ## ##',               maxDigits: 8 },
  { code: 'LR', dial: '+231', name: 'Liberia',                  mask: '### ### ###',                maxDigits: 9 },
  { code: 'LY', dial: '+218', name: 'Libya',                    mask: '### ### ###',                maxDigits: 10 },
  { code: 'LI', dial: '+423', name: 'Liechtenstein',            mask: '### ### ###',                maxDigits: 7 },
  { code: 'LT', dial: '+370', name: 'Lithuania',                mask: '# ## ### ##',                maxDigits: 8 },
  { code: 'LU', dial: '+352', name: 'Luxembourg',               mask: '### ### ###',                maxDigits: 9 },
  { code: 'MO', dial: '+853', name: 'Macau',                    mask: '#### ####',                  maxDigits: 8 },
  { code: 'MG', dial: '+261', name: 'Madagascar',               mask: '### ## ### ##',              maxDigits: 10 },
  { code: 'MW', dial: '+265', name: 'Malawi',                   mask: '# ### ### ###',              maxDigits: 9 },
  { code: 'MY', dial: '+60',  name: 'Malaysia',                 mask: '##-### ####',                maxDigits: 10 },
  { code: 'MV', dial: '+960', name: 'Maldives',                 mask: '### ####',                   maxDigits: 7 },
  { code: 'ML', dial: '+223', name: 'Mali',                     mask: '### ## ## ##',               maxDigits: 8 },
  { code: 'MT', dial: '+356', name: 'Malta',                    mask: '#### ####',                  maxDigits: 8 },
  { code: 'MH', dial: '+692', name: 'Marshall Islands',         mask: '### ###',                    maxDigits: 7 },
  { code: 'MQ', dial: '+596', name: 'Martinique',               mask: '### ## ## ##',               maxDigits: 9 },
  { code: 'MR', dial: '+222', name: 'Mauritania',               mask: '### ## ## ##',               maxDigits: 8 },
  { code: 'MU', dial: '+230', name: 'Mauritius',                mask: '# ### ####',                  maxDigits: 8 },
  { code: 'YT', dial: '+262', name: 'Mayotte',                  mask: '### ## ## ##',               maxDigits: 9 },
  { code: 'MX', dial: '+52',  name: 'Mexico',                   mask: '### ### ####',               maxDigits: 10 },
  { code: 'FM', dial: '+691', name: 'Micronesia',               mask: '### ####',                   maxDigits: 7 },
  { code: 'MD', dial: '+373', name: 'Moldova',                  mask: '### ## ##',                  maxDigits: 8 },
  { code: 'MC', dial: '+377', name: 'Monaco',                   mask: '### ### ###',                maxDigits: 9 },
  { code: 'MN', dial: '+976', name: 'Mongolia',                 mask: '## ### ## ##',               maxDigits: 8 },
  { code: 'ME', dial: '+382', name: 'Montenegro',               mask: '### ### ###',                maxDigits: 8 },
  { code: 'MS', dial: '+1',   name: 'Montserrat',               mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'MA', dial: '+212', name: 'Morocco',                  mask: '### ### ###',                maxDigits: 9 },
  { code: 'MZ', dial: '+258', name: 'Mozambique',               mask: '## ### ###',                 maxDigits: 9 },
  { code: 'MM', dial: '+95',  name: 'Myanmar',                  mask: '### ### ###',                maxDigits: 9 },
  { code: 'NA', dial: '+264', name: 'Namibia',                  mask: '# ## ### ###',               maxDigits: 9 },
  { code: 'NR', dial: '+674', name: 'Nauru',                    mask: '### ####',                   maxDigits: 7 },
  { code: 'NP', dial: '+977', name: 'Nepal',                    mask: '### ### ###',                maxDigits: 10 },
  { code: 'NL', dial: '+31',  name: 'Netherlands',              mask: '## ########',                maxDigits: 9 },
  { code: 'NC', dial: '+687', name: 'New Caledonia',            mask: '### ### ###',                maxDigits: 6 },
  { code: 'NZ', dial: '+64',  name: 'New Zealand',              mask: '### ### ####',               maxDigits: 10 },
  { code: 'NI', dial: '+505', name: 'Nicaragua',                mask: '#### ####',                  maxDigits: 8 },
  { code: 'NE', dial: '+227', name: 'Niger',                    mask: '### ## ## ##',               maxDigits: 8 },
  { code: 'NG', dial: '+234', name: 'Nigeria',                  mask: '### ### ####',               maxDigits: 10 },
  { code: 'NU', dial: '+683', name: 'Niue',                     mask: '####',                       maxDigits: 4 },
  { code: 'NF', dial: '+672', name: 'Norfolk Island',           mask: '### ## ##',                  maxDigits: 6 },
  { code: 'MK', dial: '+389', name: 'North Macedonia',          mask: '### ### ###',                maxDigits: 8 },
  { code: 'MP', dial: '+1',   name: 'Northern Mariana Islands', mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'NO', dial: '+47',  name: 'Norway',                   mask: '### ## ###',                 maxDigits: 8 },
  { code: 'OM', dial: '+968', name: 'Oman',                     mask: '## ### ###',                 maxDigits: 8 },
  { code: 'PK', dial: '+92',  name: 'Pakistan',                 mask: '### #######',                maxDigits: 10 },
  { code: 'PW', dial: '+680', name: 'Palau',                    mask: '### ####',                   maxDigits: 7 },
  { code: 'PS', dial: '+970', name: 'Palestine',                mask: '## ### ####',                maxDigits: 9 },
  { code: 'PA', dial: '+507', name: 'Panama',                   mask: '### ####',                   maxDigits: 7 },
  { code: 'PG', dial: '+675', name: 'Papua New Guinea',         mask: '### ####',                   maxDigits: 8 },
  { code: 'PY', dial: '+595', name: 'Paraguay',                 mask: '### ### ###',                maxDigits: 9 },
  { code: 'PE', dial: '+51',  name: 'Peru',                     mask: '### ### ###',                maxDigits: 9 },
  { code: 'PH', dial: '+63',  name: 'Philippines',              mask: '### #### ###',               maxDigits: 10 },
  { code: 'PN', dial: '+64',  name: 'Pitcairn',                 mask: '### ### ####',               maxDigits: 10 },
  { code: 'PL', dial: '+48',  name: 'Poland',                   mask: '### ### ###',                maxDigits: 9 },
  { code: 'PT', dial: '+351', name: 'Portugal',                 mask: '### ### ###',                maxDigits: 9 },
  { code: 'PR', dial: '+1',   name: 'Puerto Rico',              mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'QA', dial: '+974', name: 'Qatar',                    mask: '### ####',                   maxDigits: 8 },
  { code: 'CG', dial: '+242', name: 'Republic of the Congo',    mask: '# ## ### ###',               maxDigits: 7 },
  { code: 'RO', dial: '+40',  name: 'Romania',                  mask: '### ### ###',                maxDigits: 9 },
  { code: 'RU', dial: '+7',   name: 'Russia',                   mask: '### ###-##-##',              maxDigits: 10 },
  { code: 'RW', dial: '+250', name: 'Rwanda',                   mask: '### ### ###',                maxDigits: 9 },
  { code: 'BL', dial: '+590', name: 'Saint Barthélemy',         mask: '### ## ## ##',               maxDigits: 9 },
  { code: 'SH', dial: '+290', name: 'Saint Helena',             mask: '####',                       maxDigits: 4 },
  { code: 'KN', dial: '+1',   name: 'Saint Kitts and Nevis',    mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'LC', dial: '+1',   name: 'Saint Lucia',              mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'MF', dial: '+590', name: 'Saint Martin',             mask: '### ## ## ##',               maxDigits: 9 },
  { code: 'PM', dial: '+508', name: 'Saint Pierre and Miquelon',mask: '### ## ##',                  maxDigits: 6 },
  { code: 'VC', dial: '+1',   name: 'Saint Vincent and the Gri',mask: '(###) ###-####',            maxDigits: 10 },
  { code: 'WS', dial: '+685', name: 'Samoa',                    mask: '#####',                      maxDigits: 5 },
  { code: 'SM', dial: '+378', name: 'San Marino',               mask: '### ## ## ##',               maxDigits: 10 },
  { code: 'ST', dial: '+239', name: 'São Tomé and Príncipe',    mask: '### ####',                   maxDigits: 7 },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia',             mask: '## ### ####',                maxDigits: 9 },
  { code: 'SN', dial: '+221', name: 'Senegal',                  mask: '## ### ## ##',               maxDigits: 9 },
  { code: 'RS', dial: '+381', name: 'Serbia',                   mask: '### ### ###',                maxDigits: 9 },
  { code: 'SC', dial: '+248', name: 'Seychelles',               mask: '# ### ###',                  maxDigits: 7 },
  { code: 'SL', dial: '+232', name: 'Sierra Leone',             mask: '### ######',                 maxDigits: 8 },
  { code: 'SG', dial: '+65',  name: 'Singapore',                mask: '#### ####',                  maxDigits: 8 },
  { code: 'SX', dial: '+1',   name: 'Sint Maarten',             mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'SK', dial: '+421', name: 'Slovakia',                 mask: '### ### ###',                maxDigits: 9 },
  { code: 'SI', dial: '+386', name: 'Slovenia',                 mask: '### ### ###',                maxDigits: 8 },
  { code: 'SB', dial: '+677', name: 'Solomon Islands',          mask: '### ## ##',                  maxDigits: 7 },
  { code: 'SO', dial: '+252', name: 'Somalia',                  mask: '## ### ###',                 maxDigits: 7 },
  { code: 'ZA', dial: '+27',  name: 'South Africa',             mask: '## ### ####',                maxDigits: 9 },
  { code: 'GS', dial: '+500', name: 'South Georgia',            mask: '#####',                      maxDigits: 5 },
  { code: 'SS', dial: '+211', name: 'South Sudan',              mask: '### ### ###',                maxDigits: 9 },
  { code: 'ES', dial: '+34',  name: 'Spain',                    mask: '### ### ###',                maxDigits: 9 },
  { code: 'LK', dial: '+94',  name: 'Sri Lanka',                mask: '## ### ####',                maxDigits: 9 },
  { code: 'SD', dial: '+249', name: 'Sudan',                    mask: '### ### ####',               maxDigits: 9 },
  { code: 'SR', dial: '+597', name: 'Suriname',                 mask: '### ####',                   maxDigits: 7 },
  { code: 'SJ', dial: '+47',  name: 'Svalbard and Jan Mayen',   mask: '### ## ###',                 maxDigits: 8 },
  { code: 'SE', dial: '+46',  name: 'Sweden',                   mask: '###-## ## ##',               maxDigits: 10 },
  { code: 'CH', dial: '+41',  name: 'Switzerland',              mask: '## ### ## ##',               maxDigits: 9 },
  { code: 'SY', dial: '+963', name: 'Syria',                    mask: '### ### ####',               maxDigits: 9 },
  { code: 'TW', dial: '+886', name: 'Taiwan',                   mask: '# ### ## ###',               maxDigits: 9 },
  { code: 'TJ', dial: '+992', name: 'Tajikistan',               mask: '### ### ###',                maxDigits: 9 },
  { code: 'TZ', dial: '+255', name: 'Tanzania',                 mask: '### ### ###',                maxDigits: 9 },
  { code: 'TH', dial: '+66',  name: 'Thailand',                 mask: '# ### ### ###',              maxDigits: 9 },
  { code: 'TL', dial: '+670', name: 'Timor-Leste',              mask: '### ####',                   maxDigits: 8 },
  { code: 'TG', dial: '+228', name: 'Togo',                     mask: '# # ## ## ##',               maxDigits: 8 },
  { code: 'TK', dial: '+690', name: 'Tokelau',                  mask: '####',                       maxDigits: 4 },
  { code: 'TO', dial: '+676', name: 'Tonga',                    mask: '####',                       maxDigits: 5 },
  { code: 'TT', dial: '+1',   name: 'Trinidad and Tobago',      mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'TN', dial: '+216', name: 'Tunisia',                  mask: '## ### ###',                 maxDigits: 8 },
  { code: 'TR', dial: '+90',  name: 'Turkey',                   mask: '### ### ## ##',              maxDigits: 10 },
  { code: 'TM', dial: '+993', name: 'Turkmenistan',             mask: '# #### ####',                maxDigits: 8 },
  { code: 'TC', dial: '+1',   name: 'Turks and Caicos Islands', mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'TV', dial: '+688', name: 'Tuvalu',                   mask: '### ####',                   maxDigits: 8 },
  { code: 'VI', dial: '+1',   name: 'U.S. Virgin Islands',      mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'UG', dial: '+256', name: 'Uganda',                   mask: '### ### ###',                maxDigits: 9 },
  { code: 'UA', dial: '+380', name: 'Ukraine',                  mask: '## ### ## ##',               maxDigits: 9 },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates',     mask: '## ### ####',                maxDigits: 9 },
  { code: 'GB', dial: '+44',  name: 'United Kingdom',           mask: '0## ######',                 maxDigits: 10 },
  { code: 'US', dial: '+1',   name: 'United States',            mask: '(###) ###-####',             maxDigits: 10 },
  { code: 'UY', dial: '+598', name: 'Uruguay',                  mask: '# ### ## ##',                maxDigits: 8 },
  { code: 'UZ', dial: '+998', name: 'Uzbekistan',               mask: '## ### ## ##',               maxDigits: 9 },
  { code: 'VU', dial: '+678', name: 'Vanuatu',                  mask: '### ## ##',                  maxDigits: 7 },
  { code: 'VA', dial: '+39',  name: 'Vatican City',             mask: '### ######',                 maxDigits: 10 },
  { code: 'VE', dial: '+58',  name: 'Venezuela',                mask: '### ## ## ##',               maxDigits: 10 },
  { code: 'VN', dial: '+84',  name: 'Vietnam',                  mask: '## #### ####',               maxDigits: 10 },
  { code: 'WF', dial: '+681', name: 'Wallis and Futuna',        mask: '### ## ##',                  maxDigits: 6 },
  { code: 'EH', dial: '+212', name: 'Western Sahara',           mask: '### ### ###',                maxDigits: 9 },
  { code: 'YE', dial: '+967', name: 'Yemen',                    mask: '# ### ###',                  maxDigits: 9 },
  { code: 'ZM', dial: '+260', name: 'Zambia',                   mask: '## ### ####',                maxDigits: 9 },
  { code: 'ZW', dial: '+263', name: 'Zimbabwe',                 mask: '## ### ###',                maxDigits: 9 }
];
export default class InputPhone extends InputTextBase {

  static properties = {
    // generic (inherited) + phone‑specific props
    country: { type: String },
    dialCode: { type: String },
    mask: { type: String },
    localDigits: { type: String },
    requiredMessage: { type: String, attribute: 'required-message' },
  };

  constructor() {
    super();
    this.inputType = 'tel';
    this.countries = COUNTRIES;
    this.country = 'US';
    this.dialCode = '+1';
    this.mask = '(###) ###-####';
    this.localDigits = '';
    this._maskInstance = null;
    // Add country id
    this.ids.country = `inputs-country-${Math.random().toString(36).substr(2, 9)}`;
  }

  // -----------------------------------------------------------------
  // Render – exact DOM structure required by the spec
  // -----------------------------------------------------------------
  render() {
    const describedBy = [
      this.description ? this.ids.desc : null,
      this.error ? this.ids.error : null,
    ].filter(Boolean).join(' ') || null;

    const inputCls = ['i-input'];
    if (!this.valid) inputCls.push('i-input-error');

    return html`
      <div class="i-field ${this.inline ? 'i-inline' : ''}">
        <label class="i-label" id="${this.ids.label}" for="${this.ids.input}">
          ${this.label}
        </label>

        <div class="i-wrapper i-phone-wrapper">
          <select
            name="${this.name}-code"
            id="${this.ids.country}"
            class="i-select i-select-country"
            @change="${this._onCountryChange}"
            aria-label="Select country and calling code"
            ?disabled="${this.disabled}"
            ?readonly="${this.readonly}"
          >
            ${this.countries.map(c => html`
              <option
                value="${c.code}"
                ?selected="${c.code === this.country}"
              >${c.name.length > 10 ? c.name.substring(0, 10) + '...' : c.name} (${c.dial})</option>
            `)}
          </select>

          <input
            id="${this.ids.input}"
            class="${inputCls.join(' ')}"
            type="tel"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            ?readonly="${this.readonly}"
            aria-required="${this.required ? 'true' : 'false'}"
            aria-labelledby="${this.ids.label}"
            aria-describedby="${describedBy}"
            aria-invalid="${!this.valid}"
            data-maska="${this.mask}"
            @input="${this._onInput}"
            @change="${this._onChange}"
            @blur="${this._onBlur}"
          />
        </div>

        ${this._renderDescription()}
        ${this._renderError()}
      </div>
    `;
  }


  // -----------------------------------------------------------------
  // Lifecycle – create maska instance and hook up events
  // -----------------------------------------------------------------
  firstUpdated() {
    super.firstUpdated();
    // Create maska once the DOM is rendered
    const phoneInput = this.renderRoot?.querySelector('.i-input');
    if (phoneInput) {
      this._maskInstance = new MaskInput(phoneInput, { mask: this.mask });
    }
  }

  // -----------------------------------------------------------------
  // Country change – update attributes & re‑create the maska instance
  // -----------------------------------------------------------------
  _onCountryChange(e) {
    this.country = e.target.value;
    const c = this.countries.find(cc => cc.code === this.country);
    this.dialCode = c.dial;
    this.mask = c.mask;

    const phoneInput = this.renderRoot?.querySelector('.i-input');

    if (phoneInput) {
      // Get the unmasked value before destroying the old instance
      const unmaskedValue = this._maskInstance?.unmaskedValue || '';

      // Destroy previous instance (maska supports this)
      if (this._maskInstance) this._maskInstance.destroy();

      // Re‑create with the new mask
      this._maskInstance = new MaskInput(phoneInput, { mask: this.mask });

      // Reflect attributes – this makes maska re‑read the mask patterns
      phoneInput.setAttribute('data-maska', this.mask);

      console.log(this._maskInstance?.unmaskedValue)

      // Set the input value to the unmasked value so maska applies the new mask
      phoneInput.value = unmaskedValue;
      this.localDigits = unmaskedValue;
    }

    this._updateFormattedValue();
    this._updateValue();   // updates form value + fires input:input event
  }

  // -----------------------------------------------------------------
  // Input handler – override to handle phone-specific masking
  // -----------------------------------------------------------------
  _onInput(e) {
    // Update localDigits with the unmasked value from maska
    this.localDigits = this._maskInstance?.unmaskedValue || e.target.value;
    
    // Update the formatted value for display
    this._updateFormattedValue();
    
    // Call the base class update method to handle form value and events
    this._updateValue(this.formattedValue);
    this._callHook('onInput', e);
  }

  // -----------------------------------------------------------------
  // Change handler – override to handle phone-specific masking
  // -----------------------------------------------------------------
  _onChange(e) {
    // Update localDigits with the unmasked value from maska
    this.localDigits = this._maskInstance?.unmaskedValue || e.target.value;
    
    // Update the formatted value for display
    this._updateFormattedValue();
    
    // Call the base class change method
    this._handleChange();
    this._callHook('onChange', e);
  }


  // -----------------------------------------------------------------
  // Helper: recompute the formatted representation
  // -----------------------------------------------------------------
  _updateFormattedValue() {
    // maska already shows the formatted value; we only need the raw value for the form
    this.formattedValue = this._maskInstance?.maskedValue ?? this._applyMask(this.localDigits, this.mask);
  }

  // -----------------------------------------------------------------
  // Override _updateValue to handle phone-specific value updates
  // -----------------------------------------------------------------
  _updateValue(newValue) {
    // For phone input, we want to store the formatted value (with dial code)
    // but also maintain the localDigits for the mask
    if (newValue !== undefined) {
      this.formattedValue = newValue;
    }
    
    // Set the component value to include dial code + formatted number
    this.value = this.dialCode + (this.formattedValue || '');
    this.internals.setFormValue(this.value);
    this.dispatchInput();

    if (this.shouldValidate('input')) {
      this.debounceValidate();
    }
  }

  // Fallback simple mask – kept for safety
  _applyMask(digits, mask) {
    let out = '';
    let i = 0;
    for (const ch of mask) {
      if ((ch === '#' || ch === '0') && i < digits.length) out += digits[i++];
      else out += ch;
    }
    return out;
  }

  // -----------------------------------------------------------------
  // Validation – uses inherited validate from InputTextBase
  // -----------------------------------------------------------------
  async validate() {
    this._callHook('onValidate');
    this._dispatch('e:validate');

    try {
      const schema = this._buildSchema();
      await schema.parseAsync(this.value ?? '');

      this.setValidState({ valid: true });
      this._callHook('onSuccess', { value: this.value });
      return { valid: true, error: null };
    } catch (err) {
      const errorMsg = err.errors?.[0]?.message || err.message || 'Invalid value';
      this.setValidState({ valid: false, error: errorMsg });
      this._callHook('onError', { error: errorMsg });
      return { valid: false, error: errorMsg };
    }
  }
  _buildSchema() {
    let schema = z.string();

    if (this.required) {
      schema = schema.min(1, this.requiredMessage || (this.label ? `${this.label} is required` : 'This field is required'));
    }

    if (this.minDigits) {
      schema = schema.min(this.minDigits, 'Phone number is too short');
    }

    return schema;
  }

  // -----------------------------------------------------------------
  // Public API – still inherited from InputBase
  // -----------------------------------------------------------------
  reset() {
    // Reset phone‑specific state first
    this.country = 'US';
    this.dialCode = '+1';
    this.mask = '(###) ###-####';
    this.localDigits = '';
    this.formattedValue = '';
    
    // Call super.reset() which will clear the value and errors
    super.reset();
    
    // Re-initialize mask after reset
    this.updateComplete.then(() => {
      const phoneInput = this.renderRoot?.querySelector('.i-input');
      if (phoneInput) {
        if (this._maskInstance) {
          this._maskInstance.destroy();
        }
        this._maskInstance = new MaskInput(phoneInput, { mask: this.mask });
      }
    });
  }

  // Use the exact class name from the spec (i-input) instead of input-input
  focus() {
    this.renderRoot?.querySelector('.i-input')?.focus();
  }
}

customElements.define('input-phone', InputPhone);
