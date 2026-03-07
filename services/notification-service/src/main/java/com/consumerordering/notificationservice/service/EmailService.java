package com.consumerordering.notificationservice.service;

import com.consumerordering.notificationservice.model.OrderEvent;
import com.consumerordering.notificationservice.template.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final SesClient sesClient;
    private final EmailTemplateService templateService;

    @Value("${app.ses.from-email}")
    private String fromEmail;

    public void sendOrderEmail(OrderEvent event) {
        if (event.getUserEmail() == null || event.getUserEmail().isEmpty()) {
            log.warn("No email address for userId={}, skipping notification", event.getUserId());
            return;
        }

        String subject = templateService.getSubject(event);
        String htmlBody = templateService.renderHtml(event);

        try {
            SendEmailRequest request = SendEmailRequest.builder()
                    .source(fromEmail)
                    .destination(Destination.builder()
                            .toAddresses(event.getUserEmail())
                            .build())
                    .message(Message.builder()
                            .subject(Content.builder().data(subject).charset("UTF-8").build())
                            .body(Body.builder()
                                    .html(Content.builder().data(htmlBody).charset("UTF-8").build())
                                    .build())
                            .build())
                    .build();

            sesClient.sendEmail(request);
            log.info("action=SEND_EMAIL eventType={} orderId={} to={}",
                    event.getEventType(), event.getOrderId(), event.getUserEmail());
        } catch (Exception e) {
            log.error("action=SEND_EMAIL_FAILED eventType={} orderId={} to={} error={}",
                    event.getEventType(), event.getOrderId(), event.getUserEmail(), e.getMessage());
        }
    }
}
