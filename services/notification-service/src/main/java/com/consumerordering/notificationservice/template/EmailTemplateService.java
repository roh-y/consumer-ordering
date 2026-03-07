package com.consumerordering.notificationservice.template;

import com.consumerordering.notificationservice.model.OrderEvent;
import org.springframework.stereotype.Service;

@Service
public class EmailTemplateService {

    public String getSubject(OrderEvent event) {
        return switch (event.getEventType()) {
            case "ORDER_CREATED" -> "Order Confirmation - " + event.getPlanName();
            case "PLAN_CHANGED" -> "Plan Changed - " + event.getPlanName();
            case "ORDER_CANCELLED" -> "Order Cancelled";
            default -> "Order Update";
        };
    }

    public String renderHtml(OrderEvent event) {
        return switch (event.getEventType()) {
            case "ORDER_CREATED" -> renderOrderCreated(event);
            case "PLAN_CHANGED" -> renderPlanChanged(event);
            case "ORDER_CANCELLED" -> renderOrderCancelled(event);
            default -> "<p>Your order has been updated.</p>";
        };
    }

    private String renderOrderCreated(OrderEvent event) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #4f46e5; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Order Confirmed!</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Your plan has been activated successfully.</p>
                    <table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Plan</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Monthly Price</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #4f46e5;">$%.2f/mo</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; color: #666;">Order ID</td>
                            <td style="padding: 8px; font-family: monospace; font-size: 12px;">%s</td>
                        </tr>
                    </table>
                    <p style="color: #666; font-size: 12px;">This is a UAT environment — no actual charges have been made.</p>
                </div>
            </body>
            </html>
            """.formatted(event.getPlanName(), event.getPricePerMonth(), event.getOrderId());
    }

    private String renderPlanChanged(OrderEvent event) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Plan Changed</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Your plan has been changed successfully.</p>
                    <table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">New Plan</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; color: #666;">Monthly Price</td>
                            <td style="padding: 8px; font-weight: bold; color: #4f46e5;">$%.2f/mo</td>
                        </tr>
                    </table>
                    <p style="color: #666; font-size: 12px;">Your previous plan has been cancelled.</p>
                </div>
            </body>
            </html>
            """.formatted(event.getPlanName(), event.getPricePerMonth());
    }

    private String renderOrderCancelled(OrderEvent event) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Order Cancelled</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Your order has been cancelled.</p>
                    <p style="color: #666;">Order ID: <code>%s</code></p>
                    <p style="color: #666; font-size: 12px;">If this was a mistake, you can subscribe to a new plan at any time.</p>
                </div>
            </body>
            </html>
            """.formatted(event.getOrderId());
    }
}
