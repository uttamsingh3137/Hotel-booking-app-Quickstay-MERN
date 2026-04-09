import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import transporter from "../configs/nodemailer.js";
import stripe from "stripe";

//func to check availability of room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
    });
    const isAvailable = bookings.length === 0;
    return isAvailable;
  } catch (error) {
    console.log(error.message);
  }
};

//api to check availability of room

export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });

    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//api to create a new booking
// POST /api/bookings/book

export const createBooking = async (req, res) => {
  try {
    const {
      roomId: room,
      checkInDate,
      checkOutDate,
      guests,
      paymentMethod,
    } = req.body;
    const user = req.user._id;
    //before booking check availability

    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });

    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }
    //get totalPrice for room
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;

    //calculate totalPrice based on nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    totalPrice *= nights;
    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
      paymentMethod,
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: req.user.email,
      subject: "Hotel Booking Confirmation Details",
      html: `<h1>Your Booking Details</h1>
      <p>Dear ${req.user.username},</p>
      <p>Thank you for your booking! Here are your booking details:</p>
      <ul>

        <li><strong>Booking ID:</strong> ${booking._id}</li>
        <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
        <li><strong>Location:</strong> ${roomData.hotel.address}</li>
        <li><strong>Check-in Date:</strong> ${new Date(booking.checkInDate).toDateString()}</li>
        <li><strong>Check-out Date:</strong> ${new Date(booking.checkOutDate).toDateString()}</li>
        <li><strong>Total Amount:</strong> ${process.env.VITE_CURRENCY || "$"}${booking.totalPrice.toFixed(2)}</li>
        
      </ul>
      <p>Thank you for choosing our hotel!</p>
      <p>If you have any questions, feel free to contact us.</p>
    `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Booking created successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to create booking" });
  }
};

//api to get all booking for a user
//GET /api/bookings/user

export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const booking = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });

    res.json({ success: true, booking });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};

export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth.uesrId });

    if (!hotel) {
      return res.json({ success: false, message: "No Hotel found" });
    }
    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + booking.totalPrice,
      0,
    );

    res.json({
      success: true,
      dashboardData: { totalBookings, totalRevenue, bookings },
    });
  } catch (error) {
    res.json({
      success: false,
      message: "failed to fetch bookings",
    });
  }
};

//stripe payment

export const stripePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    const roomData = await Room.findById(booking.room).populate("hotel");
    const totalPrice = booking.totalPrice;
    const { origin } = req.headers;

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: roomData.hotel.name,
          },
          unit_amount: totalPrice * 100,
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      metadata: {
        bookingId,
      },
    });
    res.json({ success: true, url: session.url });
  } catch (error) {
    res.json({ success: false, message: "Payment Failed" });
  }
};
