import React, { useContext, useEffect, useState } from 'react';
import { Snackbar, IconButton, SnackbarContent } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import emailjs from '@emailjs/browser';
import isEmail from 'validator/lib/isEmail';
import { FaSquareXTwitter, FaLinkedin } from 'react-icons/fa6';
import { FaGithub, FaYoutube } from 'react-icons/fa';
import { AiOutlineSend, AiOutlineCheckCircle } from 'react-icons/ai';
import { FiPhone, FiAtSign } from 'react-icons/fi';
import { HiOutlineLocationMarker } from 'react-icons/hi';

import { ThemeContext } from '../../contexts/ThemeContext';
import { socialsData } from '../../data/socialsData';
import { contactsData } from '../../data/contactsData';
import './Contacts.css';

/* ---------- Static config ---------- */

// `key` must match the property name in data/socialsData.js (case-sensitive).
const SOCIALS = [
    { key: 'twitter', label: 'Twitter', Icon: FaSquareXTwitter },
    { key: 'github', label: 'GitHub', Icon: FaGithub },
    { key: 'linkedIn', label: 'LinkedIn', Icon: FaLinkedin },
    { key: 'youtube', label: 'YouTube', Icon: FaYoutube },
];

/* ---------- Styles ---------- */

const FIELD_STYLE = (theme) => ({
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px 16px',
    border: `2px solid ${theme.primary80}`,
    borderRadius: '14px',
    backgroundColor: theme.secondary,
    color: theme.tertiary,
    fontFamily: 'var(--primaryFont)',
    fontSize: '1rem',
    fontWeight: 500,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '&::placeholder': { opacity: 0.55 },
    '&:focus': {
        outline: 'none',
        borderColor: theme.primary600,
        boxShadow: `0 0 0 4px ${theme.primary80}`,
    },
});

const SOFT_ICON = (theme, size, fontSize) => ({
    width: size,
    height: size,
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize,
    flexShrink: 0,
    backgroundColor: theme.primary,
    color: theme.secondary,
    transition: 'transform 250ms ease, background-color 250ms ease',
    '&:hover, &:focus-visible': {
        transform: 'translateY(-3px)',
        backgroundColor: theme.tertiary,
        color: theme.secondary,
    },
    '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
        '&:hover, &:focus-visible': { transform: 'none' },
    },
});

// Created once, outside the component.
const useStyles = makeStyles({
    formCard: ({ theme }) => ({
        padding: '28px',
        borderRadius: '24px',
        border: `1px solid ${theme.primary80}`,
        backgroundColor: theme.secondary,
        boxShadow: `0 24px 48px -24px ${theme.primary80}`,
        '@media (max-width: 600px)': { padding: '18px' },
    }),
    input: ({ theme }) => FIELD_STYLE(theme),
    message: ({ theme }) => ({
        ...FIELD_STYLE(theme),
        minHeight: '140px',
        resize: 'vertical',
    }),
    label: ({ theme }) => ({
        display: 'block',
        margin: '0 0 8px 4px',
        color: theme.primary,
        fontFamily: 'var(--primaryFont)',
        fontWeight: 600,
        fontSize: '0.9rem',
        // cancel the old floating-label offset from Contacts.css
        transform: 'none',
        backgroundColor: 'transparent',
        padding: 0,
    }),
    error: {
        display: 'block',
        marginTop: '6px',
        paddingLeft: '4px',
        fontFamily: 'var(--primaryFont)',
        fontSize: '0.8rem',
        color: '#d32f2f',
    },
    submitBtn: ({ theme }) => ({
        borderRadius: '999px',
        backgroundColor: theme.primary,
        color: theme.secondary,
        transition: 'transform 250ms ease, background-color 250ms ease',
        '&:hover:not(:disabled)': {
            transform: 'translateY(-2px)',
            backgroundColor: theme.tertiary,
        },
        '&:disabled': { opacity: 0.7, cursor: 'not-allowed' },
    }),
    detailRow: ({ theme }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '10px 14px',
        borderRadius: '18px',
        textDecoration: 'none',
        transition: 'background-color 200ms ease',
        '&:hover, &:focus-visible': { backgroundColor: theme.primary80 },
    }),
    socialIcon: ({ theme }) => SOFT_ICON(theme, '46px', '21px'),
    detailsIcon: ({ theme }) => SOFT_ICON(theme, '46px', '22px'),
});

/* ---------- Helpers ---------- */

const validate = ({ name, email, message }) => {
    const errors = {};
    if (!name.trim()) errors.name = 'Enter your name';
    if (!email.trim()) errors.email = 'Enter your email';
    else if (!isEmail(email.trim()))
        errors.email = 'Enter a valid email address';
    if (!message.trim()) errors.message = 'Enter a message';
    return errors;
};

/**
 * Sends the message.
 * 1) EmailJS  -> delivers a real email to your inbox (recommended).
 * 2) sheetAPI -> falls back to your existing Google Sheet endpoint.
 */
const sendMessage = async ({ name, email, message }) => {
    const cfg = contactsData.emailjs;

    if (cfg && cfg.serviceId && cfg.templateId && cfg.publicKey) {
        return emailjs.send(
            cfg.serviceId,
            cfg.templateId,
            {
                from_name: name,
                from_email: email,
                reply_to: email,
                message,
            },
            { publicKey: cfg.publicKey }
        );
    }

    if (contactsData.sheetAPI) {
        return axios.post(contactsData.sheetAPI, { name, email, message });
    }

    throw new Error('No email service configured');
};

/* ---------- Component ---------- */

const INITIAL_FORM = { name: '', email: '', message: '' };

function Contacts() {
    const { theme } = useContext(ThemeContext);
    const classes = useStyles({ theme });

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [toast, setToast] = useState({ open: false, text: '' });

    useEffect(() => {
        if (!success) return undefined;
        const id = setTimeout(() => setSuccess(false), 4000);
        return () => clearTimeout(id);
    }, [success]);

    const showToast = (text) => setToast({ open: true, text });

    const handleToastClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setToast((t) => ({ ...t, open: false }));
    };

    const handleChange = (field) => (e) => {
        const { value } = e.target;
        setForm((f) => ({ ...f, [field]: value }));
        if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
    };

    const handleContactForm = async (e) => {
        e.preventDefault();
        if (submitting) return;

        const found = validate(form);
        setErrors(found);
        if (Object.keys(found).length > 0) {
            showToast('Fix the highlighted fields');
            return;
        }

        setSubmitting(true);
        try {
            await sendMessage({
                name: form.name.trim(),
                email: form.email.trim(),
                message: form.message.trim(),
            });
            setForm(INITIAL_FORM);
            setSuccess(true);
            showToast('Message sent. Thanks for reaching out!');
        } catch (err) {
            console.error('Contact form error:', err);
            showToast(
                `Could not send your message. Email me at ${contactsData.email} instead.`
            );
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (id, label, control) => (
        <div className='input-container' style={{ marginBottom: '18px' }}>
            <label htmlFor={id} className={classes.label}>
                {label}
            </label>
            {control}
            {errors[id] && (
                <span id={`${id}-error`} role='alert' className={classes.error}>
                    {errors[id]}
                </span>
            )}
        </div>
    );

    const fieldProps = (id) => ({
        id,
        name: id,
        value: form[id],
        onChange: handleChange(id),
        'aria-invalid': Boolean(errors[id]),
        'aria-describedby': errors[id] ? `${id}-error` : undefined,
    });

    const activeSocials = SOCIALS.filter(({ key }) => socialsData[key]);

    return (
        <div
            className='contacts'
            id='contacts'
            style={{ backgroundColor: theme.secondary }}
        >
            <div className='contacts--container'>
                <h1 style={{ color: theme.primary }}>Contacts</h1>
                <div className='contacts-body'>
                    <div className='contacts-form'>
                        <form
                            onSubmit={handleContactForm}
                            noValidate
                            className={classes.formCard}
                        >
                            {renderField(
                                'name',
                                'Name',
                                <input
                                    {...fieldProps('name')}
                                    type='text'
                                    placeholder='Full Name'
                                    autoComplete='name'
                                    className={`form-input ${classes.input}`}
                                />
                            )}
                            {renderField(
                                'email',
                                'Email',
                                <input
                                    {...fieldProps('email')}
                                    type='email'
                                    placeholder='@gmail.com'
                                    autoComplete='email'
                                    className={`form-input ${classes.input}`}
                                />
                            )}
                            {renderField(
                                'message',
                                'Message',
                                <textarea
                                    {...fieldProps('message')}
                                    placeholder='How can I help?'
                                    className={`form-message ${classes.message}`}
                                />
                            )}

                            <div className='submit-btn'>
                                <button
                                    type='submit'
                                    disabled={submitting}
                                    className={classes.submitBtn}
                                >
                                    <p>
                                        {submitting
                                            ? 'Sending...'
                                            : success
                                            ? 'Sent'
                                            : 'Send'}
                                    </p>
                                    <div className='submit-icon'>
                                        <AiOutlineSend
                                            className='send-icon'
                                            style={{
                                                animation: success
                                                    ? 'fly 0.8s linear both'
                                                    : 'initial',
                                                position: success
                                                    ? 'absolute'
                                                    : 'initial',
                                            }}
                                        />
                                        <AiOutlineCheckCircle
                                            className='success-icon'
                                            style={{
                                                display: success
                                                    ? 'inline-flex'
                                                    : 'none',
                                                opacity: success ? '1' : '0',
                                            }}
                                        />
                                    </div>
                                </button>
                            </div>
                        </form>

                        <Snackbar
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'center',
                            }}
                            open={toast.open}
                            autoHideDuration={5000}
                            onClose={handleToastClose}
                        >
                            <SnackbarContent
                                role='status'
                                action={
                                    <IconButton
                                        size='small'
                                        aria-label='Close notification'
                                        color='inherit'
                                        onClick={handleToastClose}
                                    >
                                        <CloseIcon fontSize='small' />
                                    </IconButton>
                                }
                                style={{
                                    backgroundColor: theme.primary,
                                    color: theme.secondary,
                                    fontFamily: 'var(--primaryFont)',
                                    borderRadius: '14px',
                                }}
                                message={toast.text}
                            />
                        </Snackbar>
                    </div>

                    <div className='contacts-details'>
                        {contactsData.email && (
                            <a
                                href={`mailto:${contactsData.email}`}
                                className={`personal-details ${classes.detailRow}`}
                            >
                                <div className={classes.detailsIcon}>
                                    <FiAtSign aria-hidden='true' />
                                </div>
                                <p style={{ color: theme.tertiary }}>
                                    {contactsData.email}
                                </p>
                            </a>
                        )}
                        {contactsData.phone && (
                            <a
                                href={`tel:${contactsData.phone.replace(
                                    /[^\d+]/g,
                                    ''
                                )}`}
                                className={`personal-details ${classes.detailRow}`}
                            >
                                <div className={classes.detailsIcon}>
                                    <FiPhone aria-hidden='true' />
                                </div>
                                <p style={{ color: theme.tertiary }}>
                                    {contactsData.phone}
                                </p>
                            </a>
                        )}
                        {contactsData.address && (
                            <div
                                className={`personal-details ${classes.detailRow}`}
                            >
                                <div className={classes.detailsIcon}>
                                    <HiOutlineLocationMarker aria-hidden='true' />
                                </div>
                                <p style={{ color: theme.tertiary }}>
                                    {contactsData.address}
                                </p>
                            </div>
                        )}

                        {activeSocials.length > 0 && (
                            <div
                                className='socialmedia-icons'
                                style={{ padding: '6px 14px' }}
                            >
                                {activeSocials.map(({ key, label, Icon }) => (
                                    <a
                                        key={key}
                                        href={socialsData[key]}
                                        target='_blank'
                                        rel='noreferrer noopener'
                                        aria-label={label}
                                        className={classes.socialIcon}
                                    >
                                        <Icon aria-hidden='true' />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <img
                src={theme.contactsimg}
                alt=''
                aria-hidden='true'
                className='contacts--img'
            />
        </div>
    );
}

export default Contacts;
