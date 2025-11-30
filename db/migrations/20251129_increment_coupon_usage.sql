-- Function to increment coupon usage safely
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
